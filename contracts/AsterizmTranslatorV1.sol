// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IInitializerReceiver} from "./interfaces/IInitializerReceiver.sol";
import {ITranslator} from "./interfaces/ITranslator.sol";
import {AddressLib} from "./libs/AddressLib.sol";
import {UintLib} from "./libs/UintLib.sol";
import {AsterizmEnv} from "./base/AsterizmEnv.sol";
import {AsterizmChainEnv} from "./base/AsterizmChainEnv.sol";
import {AsterizmErrors} from "./base/AsterizmErrors.sol";
import {AsterizmWithdrawalUpgradeable} from "./base/AsterizmWithdrawalUpgradeable.sol";

contract AsterizmTranslatorV1 is UUPSUpgradeable, ITranslator, AsterizmWithdrawalUpgradeable, AsterizmEnv, AsterizmChainEnv {

    using SafeERC20 for IERC20;
    using AddressLib for address;
    using UintLib for uint;

    error CustomError(uint16 _errorCode);

    /// Set initializer event
    /// @param _initializerAddress address
    event SetInitializerEvent(address _initializerAddress);

    /// Add relayer event
    /// @param _relayerAddress address
    event AddRelayerEvent(address _relayerAddress);

    /// Remove relayer event
    /// @param _relayerAddress address
    event RemoveRelayerEvent(address _relayerAddress);

    /// Add chain event
    /// @param _chainId uint64
    /// @param _chainType uint8
    event AddChainEvent(uint64 _chainId, uint8 _chainType);

    /// Remove chain event
    /// @param _chainId uint64
    event RemoveChainEvent(uint64 _chainId);

    /// Set local chain event
    /// @param _chainId uint64
    event SetLocalChainEvent(uint64 _chainId);

    /// Send message event
    /// @param _feeValue uint  Fee value
    /// @param _payload bytes  Transfer payload
    event SendMessageEvent(uint _feeValue, bytes _payload);

    /// Success transfer event
    /// @param _transferHash bytes32  Transfer hash
    event SuccessTransferEvent(bytes32 _transferHash);

    /// Log external message event
    /// @param _feeValue uint  Fee value
    /// @param _externalRelayAddress address  External relay address
    /// @param _payload bytes  Transfer payload
    event LogExternalMessageEvent(uint _feeValue, address _externalRelayAddress, bytes _payload);

    /// Transfer send event
    /// @param _srcChainId uint64  Source chain ID
    /// @param _srcAddress uint  Source address
    /// @param _dstAddress uint  Destination address
    /// @param _transferHash bytes32  Transfer hash
    event TransferSendEvent(uint64 indexed _srcChainId, uint indexed _srcAddress, uint indexed _dstAddress, bytes32 _transferHash);

    /// Resend feiled transfer event
    /// @param _transferHash bytes32
    /// @param _senderAddress uint
    /// @param _feeAmount uint
    event ResendFailedTransferEvent(bytes32 _transferHash, uint _senderAddress, uint _feeAmount);

    /// Update chain types list event
    event UpdateChainTypesEvent();

    struct Chain {
        bool exists;
        uint8 chainType; // 1 - EVM, 2 - TVM, 3 - TON, 4 - SOL
    }
    struct Relayer {
        bool exists;
    }

    IInitializerReceiver private initializerLib;
    mapping(address => Relayer) private relayers;
    mapping(uint64 => Chain) public chains;
    uint64 public localChainId;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// Initializing function for upgradeable contracts (constructor)
    /// @param _localChainId uint64  Local chain ID
    /// @param _localChainType uint8  Local chain type
    function initialize(uint64 _localChainId, uint8 _localChainType) initializer public {
        __Ownable_init(_msgSender());
        __UUPSUpgradeable_init();
        __AsterizmChainEnv_init();

        addRelayer(owner());
        addChain(_localChainId, _localChainType);
        _setLocalChainId(_localChainId);
    }

    /// Upgrade implementation address for UUPS logic
    /// @param _newImplementation address  New implementation address
    function _authorizeUpgrade(address _newImplementation) internal onlyOwner override {}

    /// Only initializer modifier
    modifier onlyInitializer() {
        require(msg.sender == address(initializerLib), CustomError(AsterizmErrors.TRANSLATOR__ONLY_INITIALIZER__ERROR));
        _;
    }

    /// Only relayer modifier
    modifier onlyRelayer() {
        require(relayers[msg.sender].exists, CustomError(AsterizmErrors.TRANSLATOR__ONLY_RELAYER__ERROR));
        _;
    }


    /*******************/
    /** Internal logic */
    /*******************/

    /// Add relayer
    /// @param _relayer address  Relayer address
    function addRelayer(address _relayer) public onlyOwner {
        relayers[_relayer].exists = true;
        emit AddRelayerEvent(_relayer);
    }

    /// Remove relayer
    /// @param _relayer address  Relayer address
    function removeRelayer(address _relayer) public onlyOwner {
        delete relayers[_relayer];
        emit RemoveRelayerEvent(_relayer);
    }

    /// Set initializer
    /// @param _initializerReceiver IInitializerReceiver  Initializer contract
    function setInitializer(IInitializerReceiver _initializerReceiver) public onlyOwner {
        initializerLib = _initializerReceiver;
        emit SetInitializerEvent(address(_initializerReceiver));
    }

    /// Add chain
    /// @param _chainId uint64  Chain ID
    /// @param _chainType uint8  Chain type
    function addChain(uint64 _chainId, uint8 _chainType) public onlyOwner {
        require(_isChainTypeAwailable(_chainType), CustomError(AsterizmErrors.TRANSLATOR__CHAIN_TYPE__ERROR));
        chains[_chainId].exists = true;
        chains[_chainId].chainType = _chainType;
        emit AddChainEvent(_chainId, _chainType);
    }

    /// Add chains list
    /// @param _chainIds uint64[]  Chain IDs
    /// @param _chainTypes uint8[]  Chain types
    function addChains(uint64[] calldata _chainIds, uint8[] calldata _chainTypes) public onlyOwner {
        for (uint i = 0; i < _chainIds.length; i++) {
            addChain(_chainIds[i], _chainTypes[i]);
        }
    }

    /// Remove chain
    /// @param _chainId uint64  Chain ID
    function removeChainById(uint64 _chainId) public onlyOwner {
        require(localChainId != _chainId, CustomError(AsterizmErrors.TRANSLATOR__REMOVING_LOCAL_CHAIN__ERROR));
        delete chains[_chainId];
        emit RemoveChainEvent(_chainId);
    }

    /// Set local chain
    /// @param _chainId uint64  Chain ID
    function _setLocalChainId(uint64 _chainId) private onlyOwner {
        require(chains[_chainId].exists, CustomError(AsterizmErrors.TRANSLATOR__CHAIN_NOT_EXISTS__ERROR));
        localChainId = _chainId;
        emit SetLocalChainEvent(_chainId);
    }

    /// Update chain types list
    function updateChainTypes() external onlyOwner {
        internalUpdateChainTypesList();
        emit UpdateChainTypesEvent();
    }


    /*******************/
    /** External logic */
    /*******************/

    /// Update trusted relay fee
    /// @param _fee uint  Relay fee
    function updateTrustedRelayFee(uint _fee) external onlyOwner {
        initializerLib.updateTrustedRelayFee(_fee);
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
        require(chains[_chainId].exists, CustomError(AsterizmErrors.TRANSLATOR__CHAIN_NOT_EXISTS__ERROR));
        return chains[_chainId].chainType;
    }

    /// Return fee amount in tokens
    /// @param _dto TrSendMessageRequestDto  Method DTO
    /// @return uint  Token fee amount
    function getFeeAmountInTokens(TrSendMessageRequestDto calldata _dto) external pure returns(uint) {
        return 0;
    }

    /// Send transfer payload
    /// @param _dto TrSendMessageRequestDto  Method DTO
    function sendMessage(TrSendMessageRequestDto calldata _dto) external payable onlyInitializer {
        require(chains[_dto.dstChainId].exists, CustomError(AsterizmErrors.TRANSLATOR__WRONG_CHAIN_ID__ERROR));
        if (msg.value > 0) {
            (bool success, ) = owner().call{value: msg.value}("");
            require(success, CustomError(AsterizmErrors.TRANSLATOR__TRANSFER_ERROR__ERROR));
        }

        bytes memory payload = abi.encode(
            localChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress,
            _dto.txId, _dto.transferResultNotifyFlag, _dto.transferHash
        );
        if (_dto.dstChainId == localChainId) {
            TrTransferMessageRequestDto memory dto = _buildTrTransferMessageRequestDto(gasleft(), payload);
            _internalTransferMessage(dto);
            emit SuccessTransferEvent(_dto.transferHash);
            return;
        }

        emit SendMessageEvent(msg.value, payload);
    }

    /// Log external transfer payload (for external relays logic)
    /// @param _externalRelayAddress address  External relay address
    /// @param _dto TrSendMessageRequestDto  Method DTO
    function logExternalMessage(address _externalRelayAddress, TrSendMessageRequestDto calldata _dto) external payable onlyInitializer {
        require(chains[_dto.dstChainId].exists, CustomError(AsterizmErrors.TRANSLATOR__CHAIN_NOT_EXISTS__ERROR));
        if (msg.value > 0) {
            (bool success, ) = owner().call{value: msg.value}("");
            require(success, CustomError(AsterizmErrors.TRANSLATOR__TRANSFER_ERROR__ERROR));
        }

        emit LogExternalMessageEvent(
            msg.value,
            _externalRelayAddress,
            abi.encode(
                localChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress,
                _dto.txId, _dto.transferResultNotifyFlag, _dto.transferHash
            )
        );
    }

    /// Resend failed by fee amount transfer
    /// @param _transferHash bytes32  Transfer hash
    /// @param _senderAddress uint  Sender address
    function resendMessage(bytes32 _transferHash, uint _senderAddress) external payable onlyInitializer {
        if (msg.value > 0) {
            (bool success, ) = owner().call{value: msg.value}("");
            require(success, CustomError(AsterizmErrors.TRANSLATOR__TRANSFER_ERROR__ERROR));
        }

        emit ResendFailedTransferEvent(_transferHash, _senderAddress, msg.value);
    }

    /// Transfer sending result notification
    /// @param _targetAddress address  Target client contract address
    /// @param _transferHash bytes32  Transfer hash
    /// @param _statusCode uint8  Status code
    function transferSendingResultNotification(address _targetAddress, bytes32 _transferHash, uint8 _statusCode) external onlyRelayer {
        initializerLib.transferSendingResultNotification(_targetAddress, _transferHash, _statusCode);
    }

    /// Initernal transfer message (for transfers in one chain)
    /// @param _dto TrTransferMessageRequestDto  Method DTO
    function _internalTransferMessage(TrTransferMessageRequestDto memory _dto) private {
        _baseTransferMessage(_dto);
    }

    /// External transfer message
    /// @param _gasLimit uint  Gas limit
    /// @param _payload bytes  Payload
    function transferMessage(uint _gasLimit, bytes calldata _payload) external onlyRelayer {
        _baseTransferMessage(_buildTrTransferMessageRequestDto(_gasLimit, _payload));
    }

    /// Base transfer message
    /// @param _dto TrTransferMessageRequestDto  Method DTO
    function _baseTransferMessage(TrTransferMessageRequestDto memory _dto) private {
        (
            uint64 srcChainId, uint srcAddress, uint64 dstChainId,
            uint dstAddress, uint txId, , bytes32 transferHash
        ) = abi.decode(
            _dto.payload,
            (uint64, uint, uint64, uint, uint, bool, bytes32)
        );

        {
            require(dstChainId == localChainId, CustomError(AsterizmErrors.TRANSLATOR__CHAIN_NOT_EXISTS__ERROR));
            require(dstAddress.toAddress().isContract(), CustomError(AsterizmErrors.TRANSLATOR__ADDRESS_IS_NOT_CONTRACT__ERROR));

            initializerLib.receivePayload(_buildIzReceivePayloadRequestDto(
                _buildBaseTransferDirectionDto(srcChainId, srcAddress, localChainId, dstAddress),
                _dto.gasLimit, txId, transferHash
            ));
        }

        emit TransferSendEvent(srcChainId, srcAddress, dstAddress, transferHash);
    }
}
