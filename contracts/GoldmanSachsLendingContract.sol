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

	enum LoanStatus { REQUESTED, APPROVED, DENIED, DISBURSED, DELAYED, PAYED}

	LoanRequestInfo public loanRequestInfo;
	LoanStatus loanApplicationStatus;
	address payable public lender;
	address payable public borrower;

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
	}

	function borrowerTakeDisbursement() public{
		borrower = payable( GoldmanSachsNFT(loanRequestInfo.nftTokenAddress).ownerOf(loanRequestInfo.tokenId));
		borrower.transfer(loanRequestInfo.loanAmount);
		loanApplicationStatus = LoanStatus.DISBURSED;
	} 

	function payLoanDue() public {

	}

	function initiateLiquidation() public {

	}

	function getBalanceOfContract() public view returns (uint256){
		return address(this).balance;
	}

	function getLoanStatus() public view returns (string memory){
		if(loanApplicationStatus == LoanStatus.APPROVED){
			return "Loan request approved and ready to disburse";
		}
		return "Request Initiated";
	}

}