// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./GoldmanSachsNFT.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GoldmanSachsLendingContract {

	struct LoanRequestInfo {
		address nftTokenAddress;
		uint256 tokenId;
		uint256 loanAmount;
		uint256 interestRate;
		uint256 loanDuration;
	}

	enum LoanStatus { REQUESTED, APPROVED, DENIED, DISBURSED, DELAYED, PAYED, LIQUIDATED}

	LoanRequestInfo public loanRequestInfo;
	LoanStatus loanApplicationStatus;
	address payable public lender;
	ERC20 LendingUSDCToken;
	address payable public borrower;
	uint loadDisburedDate;


	constructor (address nftTokenAddress,
		uint256 tokenId,
		uint256 loanAmount,
		uint256 interestRate,
		uint256 loanDuration) {
		loanRequestInfo = LoanRequestInfo(nftTokenAddress, tokenId, loanAmount, interestRate, loanDuration);
		loanApplicationStatus = LoanStatus.REQUESTED;
	}

	function lenderApproveLoanRequest() public payable returns (string memory){
		uint256 nftValue = GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).getNFTValue(loanRequestInfo.tokenId);
		require(!(GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).isUnderCollateral(loanRequestInfo.tokenId)));
		//require(msg.value >= loanRequestInfo.loanAmount);
		address nftOwner = GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).ownerOf(loanRequestInfo.tokenId);
		require(msg.sender != nftOwner);
		LendingUSDCToken = ERC20(msg.sender);
		require(LendingUSDCToken.approve(address(this), loanRequestInfo.loanAmount));
		lender = payable(msg.sender);
		borrower = payable(nftOwner);
		if(nftValue > (loanRequestInfo.loanAmount * 7/10)){
			loanApplicationStatus = LoanStatus.APPROVED;
			return "Loan Approved";
		}else{
			loanApplicationStatus = LoanStatus.DENIED;
			return "Loan Request exceeded required collateral value";
		}
	}

	function borrowerTakeDisbursement() public{
		require(msg.sender == borrower);
		require(loanApplicationStatus == LoanStatus.APPROVED);
		borrower.transfer(loanRequestInfo.loanAmount);
		loanApplicationStatus = LoanStatus.DISBURSED;
		loadDisburedDate = block.timestamp;
		GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).updateCollateralStatus(loanRequestInfo.tokenId, true);
		//TODO - USDC tokens issue logic
		//TODO - Add NFT collateral
	}

	function loanBalance() public view returns (uint256){
		uint256 timeToCalculateInterestFor =  block.timestamp - loadDisburedDate;
		uint256 noOfDays = timeToCalculateInterestFor / (60*60*24);
		uint256 interest = noOfDays * (loanRequestInfo.interestRate / (100 * 365) );
		uint256 payOffBalance = interest + loanRequestInfo.loanAmount;
		return payOffBalance;
	}

	function payLoanDue() public payable{
		require(msg.value <= loanBalance());
		loanApplicationStatus = LoanStatus.PAYED;
		GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).updateCollateralStatus(loanRequestInfo.tokenId, false);
		//TODO - update NFT collateral
		//TODO - receive payment in USDC
	}

	function initiateLiquidation() public payable{
		uint256 timeToCalculateInterestFor =  block.timestamp - loadDisburedDate;
		uint256 noOfDays = timeToCalculateInterestFor / (60*60*24);
		require(noOfDays > loanRequestInfo.loanDuration);
		require(msg.value <= loanBalance());
		//TODO - transfer NFT ownership, receive payment in USDC
	}

	function getBalanceOfContract() public view returns (uint256){
		return address(this).balance;
	}

	function getLoanStatus() public view returns (string memory){
		if(loanApplicationStatus == LoanStatus.APPROVED){
			return "Loan request approved and ready to disburse";
		}else if(loanApplicationStatus == LoanStatus.DENIED){
			return "Loan request denied";
		}else if(loanApplicationStatus == LoanStatus.DISBURSED){
			return "Loan amount disbursed";
		}else if(loanApplicationStatus == LoanStatus.DELAYED){
			return "Loan payment due date crossed. NFT available to liqudate";
		}else if(loanApplicationStatus == LoanStatus.PAYED){
			return "Loan amount payed in full. NFT collateral released";
		}else if(loanApplicationStatus == LoanStatus.LIQUIDATED){
			return "NFT sold and payed off loan amount";
		}
		return "Request Initiated";
	}

}