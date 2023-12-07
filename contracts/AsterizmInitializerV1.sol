// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

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
import "./base/AsterizmConfig.sol";
import "./base/AsterizmWithdrawalUpgradeable.sol";

contract AsterizmInitializerV1 is UUPSUpgradeable, IInitializerSender, IInitializerReceiver, AsterizmEnv, AsterizmConfig, AsterizmWithdrawalUpgradeable {

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
    /// @param _transferHash bytes32  Tansfer hash
    /// @param _reason bytes  Error reason
    event PayloadErrorEvent(uint64 _srcChainId, uint _srcAddress, uint64 _dstChainId, uint _dstAddress, bytes32 _transferHash, bytes _reason);

    /// Sent payload event
    /// @param _transferHash bytes32  Transfer hash
    event SentPayloadEvent(bytes32 _transferHash);

    ITranslator private translatorLib;
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
        require(msg.sender == address(translatorLib) || getRelayData(msg.sender).externalRelayExists, "AsterizmInitializer: only translator or external relay");
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

    /// Return fee amount in tokens
    /// @param _relayAddress  Translator address
    /// @param _dto IzInitTransferV2RequestDto  Method DTO
    /// @return uint  Token fee amount
    function getFeeAmountInTokens(address _relayAddress, IzInitTransferRequestDto calldata _dto) external view returns(uint) {
        TrSendMessageRequestDto memory dto = _buildTrSendMessageRequestDto(
            msg.sender.toUint(), _dto.dstChainId, _dto.dstAddress, _dto.txId, _dto.transferHash, _dto.transferResultNotifyFlag
        );
        if (_relayAddress == address(0)) {
            return translatorLib.getFeeAmountInTokens(dto);
        }

        return ITranslator(_relayAddress).getFeeAmountInTokens(dto);
    }

    /// Initiate asterizm transfer
    /// Only clients can call this method
    /// @param _dto IzInitTransferV2RequestDto  Method DTO
    function initTransfer(IzInitTransferRequestDto calldata _dto) external payable {
        require(!blockAddresses[localChainId][msg.sender.toUint()], "AsterizmInitializer: sender address is blocked");
        require(!blockAddresses[_dto.dstChainId][_dto.dstAddress], "AsterizmInitializer: target address is blocked");

        ingoingTransfers[_dto.transferHash] = true;
        TrSendMessageRequestDto memory dto = _buildTrSendMessageRequestDto(
            msg.sender.toUint(), _dto.dstChainId, _dto.dstAddress, _dto.txId, _dto.transferHash, _dto.transferResultNotifyFlag
        );

        address relayAddress = _dto.relay == address(0) ? address(translatorLib) : _dto.relay;

        if (_dto.feeToken != address(0)) { // Token fee logic
            IERC20 feeToken = IERC20(_dto.feeToken);
            uint feeTokenAmount = feeToken.allowance(msg.sender, address(this));
            if (feeTokenAmount > 0) {
                feeToken.transferFrom(msg.sender, address(this), feeTokenAmount);
                feeToken.approve(relayAddress, feeTokenAmount);
            }
        }

        if (relayAddress != address(translatorLib)) { // External relays logic
            ConfigDataResponseDto memory configDto = getRelayData(_dto.relay);
            if (configDto.externalRelayExists) {
                require(configDto.systemFee + configDto.externalRelayFee <= msg.value, "AsterizmInitializer: fee not enough");
                ITranslator(_dto.relay).sendMessage{value: msg.value - configDto.systemFee}(dto);
                translatorLib.logExternalMessage{value: configDto.systemFee}(_dto.relay, dto);

                return;
            }
        }

        translatorLib.sendMessage{value: msg.value}(dto);
    }

    /// Resend failed by fee amount transfer
    /// @param _transferHash bytes32  Transfer hash
    /// @param _relay address  Relay address
    function resendTransfer(bytes32 _transferHash, address _relay) external payable onlyExistsIngoingTransfer(_transferHash) {
        if (
            _relay != address(0) &&
            _relay != address(translatorLib)
        ) { // External relays logic
            ConfigDataResponseDto memory configDto = getRelayData(_relay);
            if (configDto.externalRelayExists) {
                ITranslator(_relay).resendMessage{value: msg.value}(_transferHash, msg.sender.toUint());

                return;
            }
        }

        translatorLib.resendMessage{value: msg.value}(_transferHash, msg.sender.toUint());
    }

    /// Transfer sending result notification
    /// @param _targetAddress address  Target client contract address
    /// @param _transferHash bytes32  Transfer hash
    /// @param _statusCode uint8  Status code
    function transferSendingResultNotification(address _targetAddress, bytes32 _transferHash, uint8 _statusCode) external onlyTranslatorOrExternalRelay {
        IClientReceiverContract(_targetAddress).transferSendingResultNotification(_transferHash, _statusCode);
    }

    /// Receive payload from translator
    /// @param _dto IzReceivePayloadRequestDto  Method DTO
    function receivePayload(IzReceivePayloadRequestDto calldata _dto) external onlyTranslatorOrExternalRelay {
        require(!blockAddresses[localChainId][_dto.dstAddress], "AsterizmInitializer: target address is blocked");
        require(_dto.dstAddress != address(this).toUint() && _dto.dstAddress != msg.sender.toUint(), "AsterizmInitializer: wrong destination address");

        IzAsterizmReceiveRequestDto memory dto = _buildIzAsterizmReceiveRequestDto(
            _dto.srcChainId, _dto.srcAddress, _dto.dstChainId,
            _dto.dstAddress, _dto.txId, _dto.transferHash
        );

        try IClientReceiverContract(_dto.dstAddress.toAddress()).asterizmIzReceive{gas: gasleft()}(dto) {
        } catch Error(string memory _err) {
            emit PayloadErrorEvent(_dto.srcChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress, _dto.transferHash, abi.encode(_err));
        } catch (bytes memory reason) {
            emit PayloadErrorEvent(_dto.srcChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress, _dto.transferHash, reason);
        }

        outgoingTransfers[_dto.transferHash] = true;
        emit SentPayloadEvent(_dto.transferHash);
    }
}
