const NFT = artifacts.require('NFT.sol');
const USDCToken = artifacts.require('USDCToken.sol');
const LendingContract = artifacts.require('LendingContract.sol')

let gsnfToken = undefined;
let usdcToken = undefined;
let lendingContract = undefined;
let deployer = undefined;
let lender = undefined;
let borrower = undefined;
const CoinSupply = 1000000000000000;
const nftValue = 100000000000;
const loanAmount = 500000000;

contract ('LendingContract Happy path testing', async accounts => {

	before("Deploy contracts, tokens and NFT", async function () {

		//We are marking deployer, lender, borrower addressess
		deployer = accounts[0];
		lender = accounts[2];
		borrower = accounts[3];

		//Deploying NFT smart contract
		gsnfToken = await NFT.new();

		//Creating NFT with tokenID 0 and value 1000 by borrower
		await gsnfToken.createNFT(nftValue, {from: borrower});

		//Deploy USDC smart contract with intitial supply of 1000000 wei
		usdcToken = await USDCToken.new("United States Digital Coin", "USDC", CoinSupply);

		//Transfer wei to lender account[2]
		await usdcToken.transfer(lender, loanAmount);

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
		assert(balance >= loanAmount);
	});

	it('Lending contract created', async() => {
		const lendingContract = await LendingContract.new(
			gsnfToken.address, usdcToken.address, 0, loanAmount, 12, 12);
		const loanStatus = await lendingContract.getLoanStatus();
		assert(loanStatus == "Loan request Initiated");
	});

	it('Lender approve the loan request', async() => {
		lendingContract = await LendingContract.new(
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

contract ('LendingContract exceptions testing', async accounts => {

	before("Deploy contracts, tokens and NFT", async function () {

		//We are marking deployer, lender, borrower addressess
		deployer = accounts[0];
		lender = accounts[2];
		borrower = accounts[3];

		//Deploying NFT smart contract
		gsnfToken = await NFT.new();

		//Creating NFT with tokenID 0 and value 1000 by borrower
		await gsnfToken.createNFT(nftValue, {from: borrower});

		//Deploy USDC smart contract with intitial supply of 1000000 wei
		usdcToken = await USDCToken.new("United States Digital Coin", "USDC", CoinSupply);

		//Transfer wei to lender account[2]
		await usdcToken.transfer(lender, nftValue);

	});

	it('Lender do not have enough balance to approve', async() => {
		lendingContract = await LendingContract.new(
			gsnfToken.address, usdcToken.address, 0, loanAmount, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract.address, loanAmount, {from: accounts[4]});
		try{
			await lendingContract.lenderApproveLoanRequest({from: accounts[4]});
		}catch (exception){
			assert(exception.reason == "Lender do not have enough tokens");
		}
	});

	it('Borrower requested loan more than 70 percent of NFT value failure', async() => {
		const lendingContract1 = await LendingContract.new(
			gsnfToken.address, usdcToken.address, 0, nftValue, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract1.address, nftValue, {from: lender});
		const resp = await lendingContract1.lenderApproveLoanRequest({from: lender});
		const loanStatus = await lendingContract1.getLoanStatus();
		assert(loanStatus == "Loan request denied");
	});

	it('Lender did not approve contract to transfer tokens', async() => {
		lendingContract = await LendingContract.new(
			gsnfToken.address, usdcToken.address, 0, loanAmount, 12, 12,{from: borrower});
		try{
			await lendingContract.lenderApproveLoanRequest({from: lender});
		}catch (error){
			assert(error.reason == "Lender did not approve contract to authorize transfer of loan amount");
		}
	});

	it('Only borrower can take disbursement', async() => {
		lendingContract = await LendingContract.new(
			gsnfToken.address, usdcToken.address, 0, loanAmount, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract.address, nftValue, {from: lender});
		await lendingContract.lenderApproveLoanRequest({from: lender});
		try{
			await lendingContract.borrowerTakeDisbursement({from: accounts[4]});
		}catch (error){
			assert(error.reason == "Only borrower can take disbursement!");
		}
	});

	it('Unapproved loan cannot be disbursed', async() => {
		const lendingContract1 = await LendingContract.new(
			gsnfToken.address, usdcToken.address, 0, nftValue, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract1.address, nftValue, {from: lender});
		const resp = await lendingContract1.lenderApproveLoanRequest({from: lender});
		try{
			await lendingContract1.borrowerTakeDisbursement({from: borrower});
		}catch (error){
			assert(error.reason == "Loan status is not approved!");
		}
	});

	it('Borrower did not approve contract for collateral NFT', async() => {
		lendingContract = await LendingContract.new(
			gsnfToken.address, usdcToken.address, 0, loanAmount, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract.address, loanAmount, {from: lender});
		await lendingContract.lenderApproveLoanRequest({from: lender});
		try{
			await lendingContract.borrowerTakeDisbursement({from: borrower});
		}catch (error){
			assert(error.reason == "Contract is not added for NFT approval!");
		}
	});

	it('Pay loan without enough balance', async() => {
		lendingContract = await LendingContract.new(
			gsnfToken.address, usdcToken.address, 0, loanAmount, 12, 12,{from: borrower});
		await usdcToken.approve(lendingContract.address, loanAmount, {from: lender});
		await lendingContract.lenderApproveLoanRequest({from: lender});
		await gsnfToken.approve(lendingContract.address, 0, {from: borrower});
		await lendingContract.borrowerTakeDisbursement({from: borrower});
		const loanBalance = await lendingContract.loanBalance();
		try{
			await lendingContract.payLoanDue({from: accounts[4]});
		}catch (error){
			assert(error.reason == "Sender do not have enough tokens!");
		}
	});

	it('Pay loan without approving contract as spender', async() => {
		const loanBalance = await lendingContract.loanBalance();
		try{
			await lendingContract.payLoanDue({from: borrower});
		}catch (error){
			assert(error.reason == "Contract not authorized to transfer loan amount to lender!");
		}
	});

	it('Liquidate before payment due date is not allowed', async() => {
		const loanBalance = await lendingContract.loanBalance();
		await usdcToken.transfer(accounts[4], nftValue);
		await usdcToken.approve(lendingContract.address, loanBalance, {from: accounts[4]});
		try{
			await lendingContract.initiateLiquidation({from: accounts[4]});
		}catch (error){
			assert(error.reason == "Loan due date is not reached. Cannot not liqudate.");
		}
	});

	it('Liquidater do not have enough tokens', async() => {
		try{
			advancement = 86400 * 14; // 10 Days
			await increaseTime(advancement);
			await lendingContract.initiateLiquidation({from: accounts[5]});
		}catch (error){
			assert(error.reason == "Sender do not have enough balance!");
		}
	});

});


function increaseTime(addSeconds) {
	const id = Date.now();

	return new Promise((resolve, reject) => {
		web3.currentProvider.send({
			jsonrpc: '2.0',
			method: 'evm_increaseTime',
			params: [addSeconds],
			id,
		}, (err1) => {
			if (err1) return reject(err1);

			web3.currentProvider.send({
				jsonrpc: '2.0',
				method: 'evm_mine',
				id: id + 1,
			}, (err2, res) => (err2 ? reject(err2) : resolve(res)));
		});
	});
}


















