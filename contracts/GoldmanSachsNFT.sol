pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract GoldmanSachsNFT is ERC721 {

	uint256 public countNFTs;
	mapping(uint256 => uint256) private nftPrices;
	mapping(uint256 => bool) private nftCollateralStatus;

	constructor ()  ERC721 ("GoldmanSachsNFT", "GSNFT"){
		countNFTs = 0;
	}

	function createNFT(uint256 initialPrice) public returns (uint256) {
		uint256 newItemId = countNFTs;
		_safeMint(msg.sender, newItemId);
		nftPrices[newItemId] = initialPrice;
		nftCollateralStatus[newItemId] = false;
		countNFTs = countNFTs + 1;
		return newItemId;
	}


	function getNFTValue(uint256 tokenId) public view returns (uint256) {
		return nftPrices[tokenId];
	}

}