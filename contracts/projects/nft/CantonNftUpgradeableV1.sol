// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {AsterizmClientUpgradeable, IInitializerSender} from "../../base/AsterizmClientUpgradeable.sol";
import {CantonNftErrors} from "./base/CantonNftErrors.sol";
import {BytesLib} from "../../libs/BytesLib.sol";

contract CantonNftUpgradeableV1 is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, AsterizmClientUpgradeable {

    using BytesLib for bytes;

    event SetPublicClaimAvailableEvent(bool _flag);
    event SetPublicClaimFeeEvent(uint _amount);
    event PublicClaimEvent(address _address, uint _fee);

    struct TokenStruct {
        bool exists;
    }

    string public nftUrl;
    mapping(uint => TokenStruct) public mintedTokens;

    /// Initializing function for upgradeable contracts (constructor)
    /// @param _initializerLib IInitializerSender  Initializer library address
    /// @param _title string  NFT title
    /// @param _symbol string  NFT symbol
    /// @param _nftUrl string  NFT URL
    function initialize(IInitializerSender _initializerLib, string memory _title, string memory _symbol, string memory _nftUrl) initializer public {
        __AsterizmClientUpgradeable_init(_initializerLib, true, false);
        __ERC721_init(_title, _symbol);
        __ERC721Enumerable_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        nftUrl = _nftUrl;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        return _baseURI();
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    function _baseURI() internal view override returns (string memory) {
        return nftUrl;
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
    internal
    override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
    internal
    override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// Private mint
    /// @param _tokenId uint  Token ID
    /// @param _to address  Target address
    function privateMint(uint _tokenId, address _to) private {
        _safeMint(_to, _tokenId);
    }

    /// Set NFT URL
    /// @param _nftUrl string  NFT URL
    function setNftUrl(string memory _nftUrl) external onlyOwner {
        nftUrl = _nftUrl;
    }

    /// ************
    /// Base logic
    /// ************

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (uint tokenId, bytes memory dstAddressBytes) = abi.decode(_dto.payload, (uint, bytes));
        require(!mintedTokens[tokenId].exists, CustomError(CantonNftErrors.NFT__TOKEN_INITIALIZED_ALREADY__ERROR));
        mintedTokens[tokenId].exists = true;
        _safeMint(dstAddressBytes.toAddress(), tokenId);
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (uint tokenId, bytes memory dstAddressBytes) = abi.decode(_payload, (uint, bytes));
        return abi.encodePacked(tokenId, dstAddressBytes);
    }

    /// Tokens for address
    /// @param _owner address  User address who holds NFTs
    /// @return array uint  Contains start block, end block, time range in days
    function tokensOfOwner(address _owner) external view returns (uint[] memory) {
        uint tokenCount = balanceOf(_owner);
        uint[] memory tokenIds = new uint256[](tokenCount);

        for (uint i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }

        return tokenIds;
    }
}
