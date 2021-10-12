const GoldmanSachsNFT = artifacts.require('GoldmanSachsNFT.sol');

contract ('GoldmanSachsNFT', (accounts) => {

	const toBN = web3.utils.toBN;
	var BN = web3.utils.BN;

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
	it('Add new approval', async() => {
		const gsnft = await GoldmanSachsNFT.new();
		await gsnft.createNFT(100);
		await gsnft.approve(accounts[1], 0, {from: accounts[0]});
		let approvedAddress = await gsnft.getApproved(0) ;
		assert(approvedAddress == accounts[1]);
	});
});