const GoldmanSachsNFT = artifacts.require('GoldmanSachsNFT.sol');
const USDCToken = artifacts.require('USDCToken.sol');
const GoldmanSachsLendingContract = artifacts.require('GoldmanSachsLendingContract.sol')

let gsnfToken = undefined;
let usdcToken = undefined;
let deployer = undefined;
let lender = undefined;
let borrower = undefined;

contract ('GoldmanSachsLendingContract', async accounts => {

	before("Deploy contracts, tokens and NFT", async function () {

		//We are marking deployer, lender, borrower addressess
		deployer = accounts[0];
		lender = accounts[2];
		borrower = accounts[3];

		//Deploying NFT smart contract
		gsnfToken = await GoldmanSachsNFT.new();

		//Creating NFT with tokenID 0 and value 1000
		await gsnfToken.createNFT(1000);

		//Deploy USDC smart contract with intitial supply of 1000000 wei
		usdcToken = await USDCToken.new("United States Digital Coin", "USDC", 1000000);

		//Transfer wei to lender account[2]
		await usdcToken.transfer(lender, 10000);

	});

	it('NFT created', async() => {
		const nftsCount = await gsnfToken.countNFTs();
		assert(nftsCount > 0);
	});

	it('USDC created with initial supply', async() => {
		const balance = await usdcToken.balanceOf(accounts[0]);
		assert(balance > 0);
	});

});