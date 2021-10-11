// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./GoldmanSachsNFT.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GoldmanSachsLendingContract {

	struct LoanRequestInfo {
		address nftTokenAddress;
		ERC20 USDCTokenAddress;
		uint256 tokenId;
		uint256 loanAmount;
		uint256 interestRate;
		uint256 loanDuration;
	}
	
	enum LoanStatus { REQUESTED, APPROVED, DENIED, DISBURSED, DELAYED, PAYED, LIQUIDATED}

	LoanRequestInfo public loanRequestInfo;
	LoanStatus loanApplicationStatus;
	address public lender;
	address public borrower;
	uint public loadDisburedDate;
	
	constructor (address nftTokenAddress,
		address USDCTokenAddress,
		uint256 tokenId,
		uint256 loanAmount,
		uint256 interestRate,
		uint256 loanDuration) {
		loanRequestInfo = LoanRequestInfo(nftTokenAddress, ERC20(USDCTokenAddress), tokenId, loanAmount, interestRate, loanDuration);
		loanApplicationStatus = LoanStatus.REQUESTED;
	}

	function lenderApproveLoanRequest() public payable returns (string memory) {
		uint256 nftValue = GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).getNFTValue(loanRequestInfo.tokenId);
		require(!(GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).isUnderCollateral(loanRequestInfo.tokenId)), "Provide NFT is UnderCollateral status");
		address nftOwner = GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).ownerOf(loanRequestInfo.tokenId);
		require(msg.sender != nftOwner, "NFT owner and lender are same!");
		require(loanRequestInfo.USDCTokenAddress.balanceOf(msg.sender) >= loanRequestInfo.loanAmount, "Lender do not have enough tokens");
		require(loanRequestInfo.USDCTokenAddress.allowance(msg.sender, address(this)) >= loanRequestInfo.loanAmount, "Lender did not approve contract to authorize transfer of loan amount");
		lender = (msg.sender);
		borrower = (nftOwner);
		if(nftValue > (loanRequestInfo.loanAmount * 7/10)){
			loanApplicationStatus = LoanStatus.APPROVED;
			return "Loan Approved";
		}else{
			loanApplicationStatus = LoanStatus.DENIED;
			return "Loan Request exceeded required collateral value";
		}
	}
	
	function borrowerTakeDisbursement() public {
		require(msg.sender == borrower, "Only borrower can take disbursement!");
		require(loanApplicationStatus == LoanStatus.APPROVED, "Loan status is not approved!");
		require((GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).getApproved(loanRequestInfo.tokenId)) == address(this), "Contract is not added for NFT approval!");
		loanApplicationStatus = LoanStatus.DISBURSED;
		loadDisburedDate = block.timestamp;
		GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).updateCollateralStatus(loanRequestInfo.tokenId, true);
		loanRequestInfo.USDCTokenAddress.transferFrom( lender, borrower, loanRequestInfo.loanAmount);
	}
	
	function loanBalance() public view returns (uint256){
		uint256 timeToCalculateInterestFor =  block.timestamp - loadDisburedDate;
		uint256 noOfDays = timeToCalculateInterestFor / (60*60*24);
		uint256 interest = noOfDays * (loanRequestInfo.interestRate / (100 * 365) );
		uint256 payOffBalance = interest + loanRequestInfo.loanAmount;
		return payOffBalance;
	}

	function payLoanDue() public payable{
		require(loanRequestInfo.USDCTokenAddress.balanceOf(msg.sender) >= loanBalance(), "Sender do not have enough tokens!");
		require(loanRequestInfo.USDCTokenAddress.allowance(msg.sender, address(this)) >= loanBalance(), "Contract not authorized to transfer loan amount to lender!");
		loanRequestInfo.USDCTokenAddress.transferFrom(msg.sender, lender, loanBalance());
		loanApplicationStatus = LoanStatus.PAYED;
		GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).updateCollateralStatus(loanRequestInfo.tokenId, false);
		GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).approve(address(0x0), loanRequestInfo.tokenId);
	}

	function initiateLiquidation() public payable{
		uint256 timeToCalculateInterestFor =  block.timestamp - loadDisburedDate;
		uint256 noOfDays = timeToCalculateInterestFor / (60*60*24);
		require(noOfDays > loanRequestInfo.loanDuration, "Loan due date is not reached. Cannot not liqudate.");
		require(loanRequestInfo.USDCTokenAddress.balanceOf(msg.sender) >= loanBalance(), "Sender do not have enough balance!");
		loanRequestInfo.USDCTokenAddress.transfer( lender, loanBalance());
		GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).safeTransferFrom(borrower, msg.sender, loanRequestInfo.tokenId);
		loanApplicationStatus = LoanStatus.LIQUIDATED;
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
		return "Loan request Initiated";
	}
	
}

