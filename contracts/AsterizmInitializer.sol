// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/INonce.sol";
import "./interfaces/ITranslator.sol";
import "./interfaces/IClientReceiverContract.sol";
import "./interfaces/IInitializerSender.sol";
import "./interfaces/IInitializerReceiver.sol";
import "./base/BaseAsterizmEnv.sol";

contract AsterizmInitializer is Ownable, ReentrancyGuard, IInitializerSender, IInitializerReceiver, BaseAsterizmEnv {

    using Address for address;

    /// Set translator event
    /// @param _translatorAddress address
    event SetTranslatorEvent(address _translatorAddress);

    /// Set outbound nonce event
    /// @param _nonceAddress address
    event SetOutBoundNonceEvent(address _nonceAddress);

    /// Set inbound nonce event
    /// @param _nonceAddress address
    event SetInBoundNonceEvent(address _nonceAddress);

    /// Set local chain id event
    /// @param _localChainId uint64
    event SetLocalChainIdEvent(uint64 _localChainId);

    /// Block address event
    /// @param _chainId uint64
    /// @param _address address
    event AddBlockAddressEvent(uint64 _chainId, address _address);

    /// Remove block address event
    /// @param _chainId uint64
    /// @param _address address
    event RemoveBlockAddressEvent(uint64 _chainId, address _address);

    /// Payload error event
    /// Client can listen it for moniroting error transfers
    /// @param _srcChainId uint64  Source chain ID
    /// @param _srcAddress address  Source address
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _dstAddress address  Destination address
    /// @param _nonce uint  Nonce
    /// @param _transferHash bytes32  Tansfer hash
    /// @param _payload bytes  Payload
    /// @param _reason bytes  Error reason
    event PayloadErrorEvent(uint64 _srcChainId, address _srcAddress, uint64 _dstChainId, address _dstAddress, uint _nonce, bytes32 _transferHash, bytes _payload, bytes _reason);

    /// Sent payload event
    /// @param _transferHash bytes32  Transfer hash
    event SentPayloadEvent(bytes32 _transferHash);

    INonce private inboundNonce;
    INonce private outboundNonce;
    ITranslator private translatorLib;
    uint64 private localChainId;
    mapping(uint64 => mapping(address => bool)) public blockAddresses;
    mapping(bytes32 => bool) private outgoingTransfers;

    constructor (ITranslator _translatorLibrary) {
        setTransalor(_translatorLibrary);

        localChainId = translatorLib.getLocalChainId();
        emit SetLocalChainIdEvent(localChainId);
    }

    /// Only translator modifier
    modifier onlyTranslator() {
        require(msg.sender == address(translatorLib), "AsterizmInitializer: only translator");
        _;
    }

    /** Internal logic */

    /// Set translator
    /// @param _translatorLib ITranslator  Translator library
    function setTransalor(ITranslator _translatorLib) public onlyOwner {
        translatorLib = _translatorLib;
        emit SetTranslatorEvent(address(_translatorLib));
    }

    /// Set outbound nonce
    /// @param _nonce INonce  Set outbound nonce
    function setOutBoundNonce(INonce _nonce) public onlyOwner {
        outboundNonce = _nonce;
        emit SetOutBoundNonceEvent(address(_nonce));
    }

    /// Set inbound nonce
    /// @param _nonce INonce  Set inbound nonce
    function setInBoundNonce(INonce _nonce) public onlyOwner {
        inboundNonce = _nonce;
        emit SetInBoundNonceEvent(address(_nonce));
    }

    /// Block address
    /// @param _chainId uint64  Chain id
    /// @param _address address  Address for blocking
    function addBlockAddress(uint64 _chainId, address _address) external onlyOwner {
        blockAddresses[_chainId][_address] = true;
        emit AddBlockAddressEvent(_chainId, _address);
    }

    /// Unblock address
    /// @param _chainId uint64  Chain id
    /// @param _address address  Address for unblocking
    function removeBlockAddress(uint64 _chainId, address _address) external onlyOwner {
        delete blockAddresses[_chainId][_address];
        emit RemoveBlockAddressEvent(_chainId, _address);
    }

    /** External logic */

    /// Validate income transfer by hash
    /// @param _transferHash bytes32
    function validIncomeTransferHash(bytes32 _transferHash) external view returns(bool) {
        return outgoingTransfers[_transferHash];
    }

    /// Return local chain id
    /// @return uint64
    function getLocalChainId() external view returns(uint64) {
        return localChainId;
    }

    /// Initiate asterizm transfer
    /// Only clients can call this method
    /// @param _dto IzIninTransferRequestDto  Method DTO
    function initTransfer(IzIninTransferRequestDto calldata _dto) external payable {
        require(!blockAddresses[localChainId][msg.sender], "AsterizmInitializer: sender address is blocked");
        require(!blockAddresses[_dto.dstChainId][_dto.dstAddress], "AsterizmInitializer: target address is blocked");

        TrSendMessageRequestDto memory dto = _buildTrSendMessageRequestDto(
            msg.sender, _dto.dstChainId, _dto.dstAddress, _dto.useForceOrder ? outboundNonce.increaseNonce(_dto.dstChainId, abi.encodePacked(msg.sender, _dto.dstAddress)) : 0,
            _dto.useForceOrder, _dto.txId, _dto.transferHash, _dto.payload
        );
        translatorLib.sendMessage{value: msg.value}(dto);
    }

    /// Receive payload from translator
    /// @param _dto IzReceivePayloadRequestDto  Method DTO
    function receivePayload(IzReceivePayloadRequestDto calldata _dto) external onlyTranslator {
        require(!blockAddresses[localChainId][_dto.dstAddress], "AsterizmInitializer: target address is blocked");
        if (_dto.forceOrder) {
            require(
                inboundNonce.increaseNonceWithValidation(_dto.srcChainId, abi.encodePacked(_dto.srcAddress, _dto.dstAddress), _dto.nonce) == _dto.nonce,
                "AsterizmInitializer: wrong nonce"
            );
        }

        require(_dto.dstAddress != address(this) && _dto.dstAddress != msg.sender, "AsterizmInitializer: wrong destination address");

        ClAsterizmReceiveRequestDto memory dto = _buildClAsterizmReceiveRequestDto(
            _dto.srcChainId, _dto.srcAddress, _dto.dstChainId,
            _dto.dstAddress, _dto.nonce, _dto.txId, _dto.transferHash, _dto.payload
        );

        try IClientReceiverContract(_dto.dstAddress).asterizmIzReceive{gas: _dto.gasLimit}(dto) {
        } catch Error(string memory _err) {
            emit PayloadErrorEvent(_dto.srcChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress, _dto.nonce, _dto.transferHash, _dto.payload, abi.encode(_err));
        } catch (bytes memory reason) {
            emit PayloadErrorEvent(_dto.srcChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress, _dto.nonce, _dto.transferHash, _dto.payload, reason);
        }

        outgoingTransfers[_dto.transferHash] = true;
        emit SentPayloadEvent(_dto.transferHash);
    }
}
