// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./GoldmanSachsNFT.sol";

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
		require(msg.value >= loanRequestInfo.loanAmount);
		lender = payable(msg.sender);
		if(nftValue > (loanRequestInfo.loanAmount * 7/10)){
			loanApplicationStatus = LoanStatus.APPROVED;
			return "Loan Approved";
		}else{
			loanApplicationStatus = LoanStatus.DENIED;
			return "Loan Request exceeded required collateral value";
		}
		//TODO - USDC token related logic
	}

	function borrowerTakeDisbursement() public{
		borrower = payable( GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).ownerOf(loanRequestInfo.tokenId));
		borrower.transfer(loanRequestInfo.loanAmount);
		loanApplicationStatus = LoanStatus.DISBURSED;
		loadDisburedDate = block.timestamp;
		//TODO - USDC tokens issue logic, Add NFT collateral
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
		//To do - update NFT collateral, receive payment in USDC
	}

	function initiateLiquidation() public payable{
		uint256 timeToCalculateInterestFor =  block.timestamp - loadDisburedDate;
		uint256 noOfDays = timeToCalculateInterestFor / (60*60*24);
		require(noOfDays > loanRequestInfo.loanDuration);
		require(msg.value <= loanBalance());
		//To do - transfer NFT ownership, receive payment in USDC
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