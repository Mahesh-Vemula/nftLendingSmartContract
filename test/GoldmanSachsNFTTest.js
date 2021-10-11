const GoldmanSachsNFT = artifacts.require('GoldmanSachsNFT.sol');

contract ('GoldmanSachsNFT', () => {
	it('New NFT created', async() => {
		const gsnft = await GoldmanSachsNFT.new();
		await gsnft.createNFT(100);
		const nftsCount = await gsnft.countNFTs();
		assert(nftsCount > 0);
	});
	it('NFT has correct name', async() => {
		const gsnft = await GoldmanSachsNFT.new();
		await gsnft.createNFT(100);
		const nftsCount = await gsnft.name();
		assert(nftsCount == 'GoldmanSachsNFT');
	});
	it('NFT has correct symbol', async() => {
		const gsnft = await GoldmanSachsNFT.new();
		await gsnft.createNFT(100);
		const nftsCount = await gsnft.symbol();
		assert(nftsCount == 'GSNFT');
	});
});