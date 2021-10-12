const GoldmanSachsNFT = artifacts.require('GoldmanSachsNFT.sol');
const USDCToken = artifacts.require('USDCToken.sol');
const GoldmanSachsLendingContract = artifacts.require('GoldmanSachsLendingContract.sol')

contract ('GoldmanSachsLendingContract', (accounts) => {
	it('New NFT created', async() => {
		const gsnft = await GoldmanSachsNFT.new();
		await gsnft.createNFT(100);
		const nftsCount = await gsnft.countNFTs();
		assert(nftsCount > 0);
	});
});