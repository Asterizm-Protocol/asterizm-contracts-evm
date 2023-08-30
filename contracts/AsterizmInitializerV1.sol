// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/INonce.sol";
import "./interfaces/ITranslator.sol";
import "./interfaces/IConfig.sol";
import "./interfaces/IClientReceiverContract.sol";
import "./interfaces/IInitializerSender.sol";
import "./interfaces/IInitializerReceiver.sol";
import "./interfaces/IAsterizmConfigEnv.sol";
import "./libs/AddressLib.sol";
import "./libs/UintLib.sol";
import "./base/AsterizmEnv.sol";

contract AsterizmInitializerV1 is UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, IInitializerSender, IInitializerReceiver, AsterizmEnv, IAsterizmConfigEnv {

    using AddressLib for address;
    using UintLib for uint;

    /// Set translator event
    /// @param _translatorAddress address
    event SetTranslatorEvent(address _translatorAddress);

    /// Set config event
    /// @param _configAddress address
    event SetConfigEvent(address _configAddress);

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
    /// @param _address uint
    event AddBlockAddressEvent(uint64 _chainId, uint _address);

    /// Remove block address event
    /// @param _chainId uint64
    /// @param _address uint
    event RemoveBlockAddressEvent(uint64 _chainId, uint _address);

    /// Payload error event
    /// Client can listen it for moniroting error transfers
    /// @param _srcChainId uint64  Source chain ID
    /// @param _srcAddress uint  Source address
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _dstAddress uint  Destination address
    /// @param _nonce uint  Nonce
    /// @param _transferHash bytes32  Tansfer hash
    /// @param _reason bytes  Error reason
    event PayloadErrorEvent(uint64 _srcChainId, uint _srcAddress, uint64 _dstChainId, uint _dstAddress, uint _nonce, bytes32 _transferHash, bytes _reason);

    /// Sent payload event
    /// @param _transferHash bytes32  Transfer hash
    event SentPayloadEvent(bytes32 _transferHash);

    INonce private inboundNonce;
    INonce private outboundNonce;
    ITranslator private translatorLib;
    IConfig private configLib;
    uint64 private localChainId;
    mapping(uint64 => mapping(uint => bool)) public blockAddresses;
    mapping(bytes32 => bool) private ingoingTransfers;
    mapping(bytes32 => bool) private outgoingTransfers;

    /// Initializing function for upgradeable contracts (constructor)
    /// @param _translatorLibrary ITranslator  Translator library address
    function initialize(ITranslator _translatorLibrary) initializer public {
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        setTransalor(_translatorLibrary);
        localChainId = translatorLib.getLocalChainId();
        emit SetLocalChainIdEvent(localChainId);
    }

    /// Upgrade implementation address for UUPS logic
    /// @param _newImplementation address  New implementation address
    function _authorizeUpgrade(address _newImplementation) internal onlyOwner override {}

    /// Only translator modifier
    modifier onlyTranslator() {
        require(msg.sender == address(translatorLib), "AsterizmInitializer: only translator");
        _;
    }

    /// Only translator modifier
    modifier onlyTranslatorOrExternalRelay() {
        require(msg.sender == address(translatorLib) || configLib.getRelayData(msg.sender).externalRelayExists, "AsterizmInitializer: only translator or external relay");
        _;
    }

    /// Only exists transfer modifier
    /// @param _transferHash bytes32  Transfer hash
    modifier onlyExistsIngoingTransfer(bytes32 _transferHash) {
        require(ingoingTransfers[_transferHash], "AsterizmInitializer: transfer not exists");
        _;
    }

    /** Internal logic */

    /// Set translator
    /// @param _translatorLib ITranslator  Translator library
    function setTransalor(ITranslator _translatorLib) public onlyOwner {
        translatorLib = _translatorLib;
        emit SetTranslatorEvent(address(_translatorLib));
    }

    /// Set config
    /// @param _configLib IConfig  Config library
    function setConfig(IConfig _configLib) public onlyOwner {
        configLib = _configLib;
        emit SetConfigEvent(address(_configLib));
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
    /// @param _address uint  Address for blocking
    function addBlockAddress(uint64 _chainId, uint _address) external onlyOwner {
        blockAddresses[_chainId][_address] = true;
        emit AddBlockAddressEvent(_chainId, _address);
    }

    /// Unblock address
    /// @param _chainId uint64  Chain id
    /// @param _address uint  Address for unblocking
    function removeBlockAddress(uint64 _chainId, uint _address) external onlyOwner {
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

    /// Return chain type by id
    /// @param _chainId  Chain id
    /// @return uint8  Chain type
    function getChainType(uint64 _chainId) external view returns(uint8) {
        return translatorLib.getChainType(_chainId);
    }

    /// Initiate asterizm transfer
    /// Only clients can call this method
    /// @param _dto IzIninTransferV2RequestDto  Method DTO
    function initTransfer(IzIninTransferRequestDto calldata _dto) external payable {
        require(!blockAddresses[localChainId][msg.sender.toUint()], "AsterizmInitializer: sender address is blocked");
        require(!blockAddresses[_dto.dstChainId][_dto.dstAddress], "AsterizmInitializer: target address is blocked");

        TrSendMessageRequestDto memory dto = _buildTrSendMessageRequestDto(
            msg.sender.toUint(), _dto.dstChainId, _dto.dstAddress,
            _dto.useForceOrder ? outboundNonce.increaseNonce(_dto.dstChainId, abi.encodePacked(msg.sender, _dto.dstAddress)) : 0,
            _dto.useForceOrder, _dto.txId, _dto.transferHash
        );

        if (
            _dto.relay != address(0) &&
            address(configLib) != address(0) &&
            _dto.relay != address(translatorLib)
        ) { // External relays logic
            ConfigDataResponseDto memory configDto = configLib.getRelayData(_dto.relay);
            if (configDto.externalRelayExists) {
                require(configDto.systemFee + configDto.externalRelayFee <= msg.value, "AsterizmInitializer: fee not enough");
                ITranslator(_dto.relay).sendMessage{value: msg.value - configDto.systemFee}(dto);
                translatorLib.logExternalMessage{value: configDto.systemFee}(_dto.relay, dto);

                return;
            }
        }

        translatorLib.sendMessage{value: msg.value}(dto);
        ingoingTransfers[ _dto.transferHash] = true;
    }

    /// Resend failed by fee amount transfer
    /// @param _transferHash bytes32  Transfer hash
    /// @param _relay address  Relay address
    function resendTransfer(bytes32 _transferHash, address _relay) external payable onlyExistsIngoingTransfer(_transferHash) {
        if (
            _relay != address(0) &&
            address(configLib) != address(0) &&
            _relay != address(translatorLib)
        ) { // External relays logic
            ConfigDataResponseDto memory configDto = configLib.getRelayData(_relay);
            if (configDto.externalRelayExists) {
                ITranslator(_relay).resendMessage{value: msg.value}(_transferHash, msg.sender.toUint());

                return;
            }
        }

        translatorLib.resendMessage{value: msg.value}(_transferHash, msg.sender.toUint());
    }

    /// Receive payload from translator
    /// @param _dto IzReceivePayloadRequestDto  Method DTO
    function receivePayload(IzReceivePayloadRequestDto calldata _dto) external onlyTranslatorOrExternalRelay {
        require(!blockAddresses[localChainId][_dto.dstAddress], "AsterizmInitializer: target address is blocked");
        require(_dto.dstAddress != address(this).toUint() && _dto.dstAddress != msg.sender.toUint(), "AsterizmInitializer: wrong destination address");

        IzAsterizmReceiveRequestDto memory dto = _buildIzAsterizmReceiveRequestDto(
            _dto.srcChainId, _dto.srcAddress, _dto.dstChainId,
            _dto.dstAddress, _dto.nonce, _dto.txId, _dto.transferHash
        );

        try IClientReceiverContract(_dto.dstAddress.toAddress()).asterizmIzReceive{gas: gasleft()}(dto) {
        } catch Error(string memory _err) {
            emit PayloadErrorEvent(_dto.srcChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress, _dto.nonce, _dto.transferHash, abi.encode(_err));
        } catch (bytes memory reason) {
            emit PayloadErrorEvent(_dto.srcChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress, _dto.nonce, _dto.transferHash, reason);
        }

        outgoingTransfers[_dto.transferHash] = true;
        emit SentPayloadEvent(_dto.transferHash);
    }
}
