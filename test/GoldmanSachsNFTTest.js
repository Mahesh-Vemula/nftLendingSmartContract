const GoldmanSachsNFT = artifacts.require('GoldmanSachsNFT.sol');

contract ('GoldmanSachsNFT', (accounts) => {

	const toBN = web3.utils.toBN;

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
		tokenId = await gsnft.createNFT(100);
		console.log(accounts);
		//address addressForApprove = "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB"
		//var addressForApprove = accounts[1];
		gsnft.approve( accounts[1], tokenId);
		//console.log(BigNumber(await gsnft.getApproved(tokenId)));
		//await gsnft.getApproved(tokenId);
		//assert(tokenApprovedAddress == accounts[1]);
		//assert(true);
	});
});