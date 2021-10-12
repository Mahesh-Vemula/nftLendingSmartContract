const GoldmanSachsNFT = artifacts.require('GoldmanSachsNFT.sol');
const USDCToken = artifacts.require('USDCToken.sol');
const GoldmanSachsLendingContract = artifacts.require('GoldmanSachsLendingContract.sol')

let gsnfToken = undefined;
let usdcToken = undefined;
let lendingContract = undefined;
let deployer = undefined;
let lender = undefined;
let borrower = undefined;
const nftValue = 1000;
const loanAmount = 500;

contract ('GoldmanSachsLendingContract Happy path testing', async accounts => {

	before("Deploy contracts, tokens and NFT", async function () {

		//We are marking deployer, lender, borrower addressess
		deployer = accounts[0];
		lender = accounts[2];
		borrower = accounts[3];

		//Deploying NFT smart contract
		gsnfToken = await GoldmanSachsNFT.new();

		//Creating NFT with tokenID 0 and value 1000 by borrower
		await gsnfToken.createNFT(nftValue, {from: borrower});

		//Deploy USDC smart contract with intitial supply of 1000000 wei
		usdcToken = await USDCToken.new("United States Digital Coin", "USDC", 1000000);

		//Transfer wei to lender account[2]
		await usdcToken.transfer(lender, 10000);

	});

	it('NFT created', async() => {
		const nftsCount = await gsnfToken.countNFTs();
		assert(nftsCount > 0);
	});

	it('NFT has value', async() => {
		const nftValue = await gsnfToken.getNFTValue(0);
		assert(nftValue > 0);
	});

	it('USDC created with initial supply', async() => {
		const balance = await usdcToken.balanceOf(accounts[0]);
		assert(balance > 0);
	});

	it('Lender has enough balance', async() => {
		const balance = await usdcToken.balanceOf(lender);
		assert(balance >= nftValue);
	});

	it('Lending contract created', async() => {
		const lendingContract = await GoldmanSachsLendingContract.new(
			gsnfToken.address, usdcToken.address, 0, 500, 12, 12);
		const loanStatus = await lendingContract.getLoanStatus();
		assert(loanStatus == "Loan request Initiated");
	});

	it('Lender approve the loan request', async() => {
		lendingContract = await GoldmanSachsLendingContract.new(
			gsnfToken.address, usdcToken.address, 0, loanAmount, 12, 12);
		await usdcToken.approve(lendingContract.address, loanAmount, {from: lender});
		await lendingContract.lenderApproveLoanRequest({from: lender});
		const loanStatus = await lendingContract.getLoanStatus();
		assert(loanStatus == "Loan request approved and ready to disburse");
	});

	it('Borrower take disbursement', async() => {
		await gsnfToken.approve(lendingContract.address, 0, {from: borrower});
		const balanceBeforeLoan = await usdcToken.balanceOf(borrower);
		await lendingContract.borrowerTakeDisbursement({from: borrower});
		const loanStatus = await lendingContract.getLoanStatus();
		assert(loanStatus == "Loan amount disbursed");
		const balanceAfterLoan = await usdcToken.balanceOf(borrower);
		assert((balanceAfterLoan.sub(balanceBeforeLoan)).toNumber() == loanAmount);
	});

	it('Borrower pay back loan amount to lender', async() => {
		const loanBalance = await lendingContract.loanBalance();
		await usdcToken.approve(lendingContract.address, loanBalance, {from: borrower});
		const balanceBeforePayment = await usdcToken.balanceOf(lender);
		await lendingContract.payLoanDue({from: borrower});
		const balanceAfterPayment = await usdcToken.balanceOf(lender);
		assert((balanceAfterPayment.sub(balanceBeforePayment)).toNumber() == loanAmount);
		const approvedFor = await gsnfToken.getApproved(0);
		assert(approvedFor == 0);
	});

});

contract ('GoldmanSachsLendingContract exceptions testing', async accounts => {

	before("Deploy contracts, tokens and NFT", async function () {

		//We are marking deployer, lender, borrower addressess
		deployer = accounts[0];
		lender = accounts[2];
		borrower = accounts[3];

		//Deploying NFT smart contract
		gsnfToken = await GoldmanSachsNFT.new();

		//Creating NFT with tokenID 0 and value 1000 by borrower
		await gsnfToken.createNFT(nftValue, {from: borrower});

		//Deploy USDC smart contract with intitial supply of 1000000 wei
		usdcToken = await USDCToken.new("United States Digital Coin", "USDC", 1000000);

		//Transfer wei to lender account[2]
		await usdcToken.transfer(lender, 10000);

	});

	it('Lender do not have enough balance to approve', async() => {
		lendingContract = await GoldmanSachsLendingContract.new(
			gsnfToken.address, usdcToken.address, 0, loanAmount, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract.address, loanAmount, {from: accounts[4]});
		try{
			await lendingContract.lenderApproveLoanRequest({from: accounts[4]});
		}catch (exception){
			assert(exception.reason == "Lender do not have enough tokens");
		}
	});

	it('Borrower requested loan more than 70 percent of NFT value failure', async() => {
		const lendingContract1 = await GoldmanSachsLendingContract.new(
			gsnfToken.address, usdcToken.address, 0, 1000, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract1.address, 1000, {from: lender});
		const resp = await lendingContract1.lenderApproveLoanRequest({from: lender});
		const loanStatus = await lendingContract1.getLoanStatus();
		assert(loanStatus == "Loan request denied");
	});

	it('Lender did not approve contract to transfer tokens', async() => {
		lendingContract = await GoldmanSachsLendingContract.new(
			gsnfToken.address, usdcToken.address, 0, nftValue, 12, 12,{from: borrower});
		try{
			await lendingContract.lenderApproveLoanRequest({from: lender});
		}catch (error){
			assert(error.reason == "Lender did not approve contract to authorize transfer of loan amount");
		}
	});

	it('Only borrower can take disbursement', async() => {
		lendingContract = await GoldmanSachsLendingContract.new(
			gsnfToken.address, usdcToken.address, 0, loanAmount, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract.address, 1000, {from: lender});
		await lendingContract.lenderApproveLoanRequest({from: lender});
		try{
			await lendingContract.borrowerTakeDisbursement({from: accounts[4]});
		}catch (error){
			assert(error.reason == "Only borrower can take disbursement!");
		}
	});

	it('Unapproved loan cannot be disbursed', async() => {
		const lendingContract1 = await GoldmanSachsLendingContract.new(
			gsnfToken.address, usdcToken.address, 0, 1000, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract1.address, 1000, {from: lender});
		const resp = await lendingContract1.lenderApproveLoanRequest({from: lender});
		try{
			await lendingContract1.borrowerTakeDisbursement({from: borrower});
		}catch (error){
			assert(error.reason == "Loan status is not approved!");
		}
	});

	it('Borrower did not approve contract for collateral NFT', async() => {
		lendingContract = await GoldmanSachsLendingContract.new(
			gsnfToken.address, usdcToken.address, 0, loanAmount, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract.address, 1000, {from: lender});
		await lendingContract.lenderApproveLoanRequest({from: lender});
		try{
			await lendingContract.borrowerTakeDisbursement({from: borrower});
		}catch (error){
			assert(error.reason == "Contract is not added for NFT approval!");
		}
	});

});

















