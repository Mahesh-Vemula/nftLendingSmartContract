pragma solidity ^0.8.4;

import “openzeppelin-solidity/contracts/token/ERC721/ERC721.sol”;
import ‘openzeppelin-solidity/contracts/ownership/Ownable.sol’;

contract GoldmanSachsNFT is ERC721 {

	uint256 public countNFTs;
	uint256 public currentPrice;

	constructor () public ERC721 ("GoldmanSachsNFT", "GSNFT"){
		countNFTs = 0;
	}

	function createNFT(string memory tokenURI, uint256 currentPrice) public returns (uint256) {
		uint256 newItemId = countNFTs;
		_safeMint(msg.sender, newItemId);
		_setTokenURI(newItemId, tokenURI);
		currentPrice = currentPrice;
		countNFTs = countNFTs + 1;
		return newItemId;
	}

}