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

    /// Set decryption send availeble event
    /// @param _flag bool
    event SetDecriptionSendAvailableEvent(bool _flag);

    /// Set encryption send availeble event
    /// @param _flag bool
    event SetEncriptionSendAvailableEvent(bool _flag);

    /// Block address event
    /// @param _address address
    event AddBlockAddressEvent(address _address);

    /// Remove block address event
    /// @param _address address
    event RemoveBlockAddressEvent(address _address);

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

    struct SendedTransfer {
        bool successIncome;
        bool successOutgoing;
    }

    INonce private inboundNonce;
    INonce private outboundNonce;
    ITranslator private translatorLib;
    bool public isDecSendAvailable;
    bool public isEncSendAvailable;
    mapping(address => bool) public blockAddresses;
    mapping(bytes32 => SendedTransfer) private sendedTransfers;

    constructor (ITranslator _translatorLibrary) {
        setTransalor(_translatorLibrary);
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

    /// Set decription send available flag
    /// @param _value bool  Available flag
    function setIsDecSendAvailable(bool _value) external onlyOwner {
        isDecSendAvailable = _value;
        emit SetDecriptionSendAvailableEvent(_value);
    }

    /// Set encription send available flag
    /// @param _value bool  Available flag
    function setIsEncSendAvailable(bool _value) external onlyOwner {
        isEncSendAvailable = _value;
        emit SetEncriptionSendAvailableEvent(_value);
    }

    /// Block address
    /// @param _address address  Available flag
    function addBlockAddress(address _address) external onlyOwner {
        blockAddresses[_address] = true;
        emit AddBlockAddressEvent(_address);
    }

    /// Unblock address
    /// @param _address address  Available flag
    function removeBlockAddress(address _address) external onlyOwner {
        delete blockAddresses[_address];
        emit RemoveBlockAddressEvent(_address);
    }

    /** External logic */

    /// Validate income transfer by hash
    /// @param _transferHash bytes32
    function validIncomeTarnsferHash(bytes32 _transferHash) external view returns(bool) {
        return sendedTransfers[_transferHash].successIncome;
    }

    /// Validate outhoing transfer by hash
    /// @param _transferHash bytes32
    function validOutgoingTarnsferHash(bytes32 _transferHash) external view returns(bool) {
        return sendedTransfers[_transferHash].successOutgoing;
    }

    /// Initiate asterizm transfer
    /// Only clients can call this method
    /// @param _dto IzIninTransferRequestDto  Method DTO
    function initTransfer(IzIninTransferRequestDto calldata _dto) external payable {
        require(!blockAddresses[msg.sender], "AsterizmInitializer: sender address is blocked");
        require(!blockAddresses[_dto.dstAddress], "AsterizmInitializer: target address is blocked");
        _dto.useEncryption ?
            require(isEncSendAvailable, "AsterizmInitializer: encode transfer is unavailable") :
            require(isDecSendAvailable, "AsterizmInitializer: decode transfer is unavailable");

        TrSendMessageRequestDto memory dto = _buildTrSendMessageRequestDto(
            msg.sender, _dto.dstChainId, _dto.dstAddress, _dto.useForceOrder ? outboundNonce.increaseNonce(_dto.dstChainId, abi.encodePacked(msg.sender, _dto.dstAddress)) : 0,
            _dto.useEncryption, _dto.useForceOrder, _dto.txId, _dto.transferHash, _dto.payload
        );
        translatorLib.sendMessage{value: msg.value}(dto);
    }

    /// Receive payload from translator
    /// @param _dto IzReceivePayloadRequestDto  Method DTO
    function receivePayload(IzReceivePayloadRequestDto calldata _dto) external onlyTranslator {
        require(!blockAddresses[_dto.dstAddress], "AsterizmInitializer: target address is blocked");
        require(!sendedTransfers[_dto.transferHash].successIncome, "AsterizmInitializer: message sent already");
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

        sendedTransfers[_dto.transferHash].successIncome = true;
        try IClientReceiverContract(_dto.dstAddress).asterizmIzReceive{gas: _dto.gasLimit}(dto) {
        } catch Error(string memory _err) {
            emit PayloadErrorEvent(_dto.srcChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress, _dto.nonce, _dto.transferHash, _dto.payload, abi.encode(_err));
        } catch (bytes memory reason) {
            emit PayloadErrorEvent(_dto.srcChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress, _dto.nonce, _dto.transferHash, _dto.payload, reason);
        }

        sendedTransfers[_dto.transferHash].successOutgoing = true;
        emit SentPayloadEvent(_dto.transferHash);
    }
}
