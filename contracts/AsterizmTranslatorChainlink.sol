// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {IInitializerReceiver} from "./interfaces/IInitializerReceiver.sol";
import {ITranslator} from "./interfaces/ITranslator.sol";
import {AddressLib} from "./libs/AddressLib.sol";
import {UintLib} from "./libs/UintLib.sol";
import {AsterizmEnv} from "./base/AsterizmEnv.sol";
import {AsterizmChainEnv} from "./base/AsterizmChainEnv.sol";
import {AsterizmWithdrawal} from "./base/AsterizmWithdrawal.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AsterizmTranslatorChainlink is CCIPReceiver, ITranslator, AsterizmEnv, AsterizmChainEnv, AsterizmWithdrawal {

    using SafeERC20 for IERC20;
    using AddressLib for address;
    using UintLib for uint;

    /// Set initializer event
    /// @param _initializerAddress address
    event SetInitializerEvent(address _initializerAddress);

    /// Set config event
    /// @param _configAddress address
    event SetConfigEvent(address _configAddress);

    /// Set base router event
    /// @param _baseRouterAddress address
    event SetBaseRouterEvent(address _baseRouterAddress);

    /// Set fee token event
    /// @param _feeTokenAddress address
    event SetFeeTokenEvent(address _feeTokenAddress);

    /// Set base gas limit event
    /// @param _baseGasLimitAmount uint
    event SetBaseGasLimitEvent(uint _baseGasLimitAmount);

    /// Add relayer event
    /// @param _relayerAddress address
    event AddRelayerEvent(address _relayerAddress);

    /// Remove relayer event
    /// @param _relayerAddress address
    event RemoveRelayerEvent(address _relayerAddress);

    /// Add chain event
    /// @param _chainId uint64
    /// @param _chainType uint8
    /// @param _chainSelector uint64
    event AddChainEvent(uint64 _chainId, uint8 _chainType, uint64 _chainSelector);

    /// Add chain relay event
    /// @param _chainId uint64
    /// @param _relayAddress address
    event AddChainRelayEvent(uint64 _chainId, address _relayAddress);

    /// Remove chain event
    /// @param _chainId uint64
    event RemoveChainEvent(uint64 _chainId);

    /// Set local chain event
    /// @param _chainId uint64
    event SetLocalChainEvent(uint64 _chainId);

    /// Send message event
    /// @param _transferHash bytes32  Transfer hash
    /// @param _messageId bytes32  Chainlink message ID
    /// @param _payload bytes  Transfer payload
    event SendMessageEvent(bytes32 _transferHash, bytes32 _messageId, bytes _payload);

    /// Success transfer event
    /// @param _transferHash bytes32  Transfer hash
    event SuccessTransferEvent(bytes32 _transferHash);

    /// Log external message event
    /// @param _feeValue uint  Fee value
    /// @param _externalRelayAddress address  External relay address
    /// @param _payload bytes  Transfer payload
    event LogExternalMessageEvent(uint _feeValue, address _externalRelayAddress, bytes _payload);

    /// Withdraw event
    /// @param _target address
    /// @param _amount uint
    event WithdrawEvent(address _target, uint _amount);

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

    struct Chain {
        bool exists;
        uint8 chainType; // 1 - EVM, 2 - TVM
        uint64 chainSelector;
        address relayAddress;
    }
    struct Relayer {
        bool exists;
    }

    IInitializerReceiver private initializerLib;
    IRouterClient private baseRouter;
    IERC20 private feeToken;
    mapping(address => Relayer) private relayers;
    mapping(uint64 => Chain) public chains;
    uint64 public localChainId;
    uint public baseGasLimit;

    /// Constructor
    /// @param _localChainId uint64  Local chain ID
    /// @param _localChainType uint8  Local chain type
    /// @param _localChainSelector uint64  Local chain selector
    /// @param _baseRouter IRouterClient  Base system router (Chainlink)
    /// @param _feeToken IERC20  Fee token
    constructor(uint64 _localChainId, uint8 _localChainType, uint64 _localChainSelector, IRouterClient _baseRouter, IERC20 _feeToken)
    Ownable(_msgSender())
    CCIPReceiver(address(_baseRouter))
    {
        __AsterizmChainEnv_init();
        addRelayer(owner());
        addChain(_localChainId, _localChainType, _localChainSelector);
        addChainRelay(_localChainId, address(this));
        _setLocalChainId(_localChainId);
        setBaseRouter(_baseRouter);
        setFeeToken(_feeToken);
    }

    /// Only initializer modifier
    modifier onlyInitializer() {
        require(msg.sender == address(initializerLib), "TranslatorChainlink: only initializer");
        _;
    }

    /// Only relayer modifier
    modifier onlyRelayer() {
        require(relayers[msg.sender].exists, "TranslatorChainlink: only relayer");
        _;
    }

    /// Only allow relay modifier
    /// @param _dto Client.Any2EVMMessage  Chainlink message dto
    modifier onlyAllowRelay(Client.Any2EVMMessage memory _dto) {
        (uint64 srcChainId, , , , , ,) = abi.decode(_dto.data, (uint64, uint, uint64, uint, uint, bool, bytes32));
        require(
            chains[srcChainId].exists &&
            chains[srcChainId].chainSelector == _dto.sourceChainSelector &&
            chains[srcChainId].relayAddress == address(uint160(bytes20(_dto.sender))),
            "TranslatorChainlink: only alloy relay"
        );
        _;
    }

    /** Internal logic */

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
    /// @param _chainSelector uint64  Chain selector
    function addChain(uint64 _chainId, uint8 _chainType, uint64 _chainSelector) public onlyOwner {
        require(_isChainTypeAwailable(_chainType), "TranslatorChainlink: chain type is unavailable");
        chains[_chainId].exists = true;
        chains[_chainId].chainType = _chainType;
        chains[_chainId].chainSelector = _chainSelector;
        emit AddChainEvent(_chainId, _chainType, _chainSelector);
    }

    /// Add chains list
    /// @param _chainIds uint64[]  Chain IDs
    /// @param _chainTypes uint8[]  Chain types
    /// @param _chainSelectors uint64[]  Chain selectors
    function addChains(
        uint64[] calldata _chainIds, uint8[] calldata _chainTypes, uint64[] calldata _chainSelectors
    ) public onlyOwner {
        for (uint i = 0; i < _chainIds.length; i++) {
            addChain(_chainIds[i], _chainTypes[i], _chainSelectors[i]);
        }
    }

    /// Add chain relay
    /// @param _chainId uint64  Chain ID
    /// @param _relayAddress address  Chain relay
    function addChainRelay(uint64 _chainId, address _relayAddress) public onlyOwner {
        require(chains[_chainId].exists, "TranslatorChainlink: chain is not exists");
        chains[_chainId].relayAddress = _relayAddress;
        emit AddChainRelayEvent(_chainId, _relayAddress);
    }

    /// Add chain relays list
    /// @param _chainIds uint64[]  Chain IDs
    /// @param _relayAddresses address[]  Chain relays
    function addChainRelays(uint64[] calldata _chainIds, address[] calldata _relayAddresses) public onlyOwner {
        for (uint i = 0; i < _chainIds.length; i++) {
            addChainRelay(_chainIds[i], _relayAddresses[i]);
        }
    }

    /// Remove chain
    /// @param _chainId uint64  Chain ID
    function removeChainById(uint64 _chainId) public onlyOwner {
        require(localChainId != _chainId, "TranslatorChainlink: removing local chain");
        delete chains[_chainId];
        emit RemoveChainEvent(_chainId);
    }

    /// Set local chain
    /// @param _chainId uint64  Chain ID
    function _setLocalChainId(uint64 _chainId) private onlyOwner {
        require(chains[_chainId].exists, "TranslatorChainlink: chain is not exists");
        localChainId = _chainId;
        emit SetLocalChainEvent(_chainId);
    }

    /** External logic */

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
        require(chains[_chainId].exists, "TranslatorChainlink: chain not found");
        return chains[_chainId].chainType;
    }

    /// Return base router address
    /// @return address
    function getBaseRouter() external view returns(address) {
        return address(baseRouter);
    }

    /// Set base router
    /// @param _baseRouter IRouterClient  Base router
    function setBaseRouter(IRouterClient _baseRouter) public onlyOwner {
        baseRouter = _baseRouter;
        emit SetBaseRouterEvent(address(_baseRouter));
    }

    /// Return fee token address
    /// @return address
    function getFeeToken() external view returns(address) {
        return address(feeToken);
    }

    /// Set fee token
    /// @param _feeToken IERC20  Fee token
    function setFeeToken(IERC20 _feeToken) public onlyOwner {
        feeToken = _feeToken;
        emit SetFeeTokenEvent(address(_feeToken));
    }

    /// Return base gas limit
    /// @return uint
    function getBaseGasLimit() external view returns(uint) {
        return baseGasLimit;
    }

    /// Set base gas limit
    /// @param _baseGasLimit uint  Base gas limit
    function setBaseGasLimit(uint _baseGasLimit) public onlyOwner {
        baseGasLimit = _baseGasLimit;
        emit SetBaseGasLimitEvent(_baseGasLimit);
    }

    /// Return fee amount in tokens private
    /// @param _message Client.EVM2AnyMessage  Method DTO
    /// @param _dstChainId uint64  Method DTO
    /// @return uint  Token fee amount
    function getFeeAmountInTokenPrivate(Client.EVM2AnyMessage memory _message, uint64 _dstChainId) private view returns(uint) {
        return baseRouter.getFee(chains[_dstChainId].chainSelector, _message);
    }

    /// Build base router message
    /// @param _dto TrSendMessageRequestDto  Method DTO
    /// @return Client.EVM2AnyMessage  Base router message
    function buildBaseRouterMessage(TrSendMessageRequestDto memory _dto, uint _gasLimitValue) private view returns(Client.EVM2AnyMessage memory) {
        return Client.EVM2AnyMessage({
            receiver: abi.encode(chains[_dto.dstChainId].relayAddress),
            data: abi.encode(
                localChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress,
                _dto.txId, _dto.transferResultNotifyFlag, _dto.transferHash
            ),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: _gasLimitValue, strict: false})
            ),
            feeToken: address(feeToken)
        });
    }

    /// Return fee amount in tokens
    /// @param _dto TrSendMessageRequestDto  Method DTO
    /// @return uint  Token fee amount
    function getFeeAmountInTokens(TrSendMessageRequestDto memory _dto) external view returns(uint) {
        return getFeeAmountInTokenPrivate(buildBaseRouterMessage(_dto, baseGasLimit), _dto.dstChainId);
    }

    /// Send transfer payload
    /// @param _dto TrSendMessageRequestDto  Method DTO
    function sendMessage(TrSendMessageRequestDto calldata _dto) external payable onlyInitializer {
        require(chains[_dto.dstChainId].exists, "TranslatorChainlink: wrong chain id");
        if (msg.value > 0) {
            (bool success, ) = owner().call{value: msg.value}("");
            require(success, "TranslatorChainlink: transfer error");
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

        Client.EVM2AnyMessage memory chainlinkMessage = buildBaseRouterMessage(_dto, baseGasLimit);
        uint chainlinkFee = getFeeAmountInTokenPrivate(chainlinkMessage, _dto.dstChainId);
        uint feeTokenAllowance = feeToken.allowance(address(initializerLib), address(this));
        require(feeTokenAllowance >= chainlinkFee, "TranslatorChainlink: fee token allowance is not enough");
        if (chainlinkFee > 0) {
            feeToken.safeTransferFrom(address(initializerLib), address(this), chainlinkFee);
            feeToken.forceApprove(address(baseRouter), chainlinkFee);
        }

        bytes32 messageId = baseRouter.ccipSend(chains[_dto.dstChainId].chainSelector, chainlinkMessage);
        emit SendMessageEvent(_dto.transferHash, messageId, payload);
    }

    /// Log external transfer payload (for external relays logic, method NOT SUPPORTED in Chainlink!)
    /// @param _externalRelayAddress address  External relay address
    /// @param _dto TrSendMessageRequestDto  Method DTO
    function logExternalMessage(address _externalRelayAddress, TrSendMessageRequestDto calldata _dto) external payable onlyInitializer {
        return;
    }

    /// Resend failed by fee amount transfer (method NOT SUPPORTED in Chainlink!)
    /// @param _transferHash bytes32  Transfer hash
    /// @param _senderAddress uint  Sender address
    function resendMessage(bytes32 _transferHash, uint _senderAddress) external payable onlyInitializer {
        if (msg.value > 0) {
            (bool success, ) = msg.sender.call{value: msg.value}("");
            require(success, "TranslatorChainlink: transfer error");
        }

        return;
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

    /// External transfer message (_ccipReceive() is used instead of this method)
    /// @param _gasLimit uint  Gas limit
    /// @param _payload bytes  Payload
    function transferMessage(uint _gasLimit, bytes calldata _payload) external onlyRelayer {
        return;
    }

    /// CCIP receiver
    /// @param _dto Client.Any2EVMMessage  Chainlink message dto
    function _ccipReceive(Client.Any2EVMMessage memory _dto) internal override onlyAllowRelay(_dto) {
        _baseTransferMessage(_buildTrTransferMessageRequestDto(gasleft(), _dto.data));
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
            require(dstChainId == localChainId, "TranslatorChainlink: wrong chain id");
            require(dstAddress.toAddress().isContract(), "TranslatorChainlink: destination address is non-contract");

            initializerLib.receivePayload(_buildIzReceivePayloadRequestDto(
                _buildBaseTransferDirectionDto(srcChainId, srcAddress, localChainId, dstAddress),
                _dto.gasLimit, txId, transferHash
            ));
        }

        emit TransferSendEvent(srcChainId, srcAddress, dstAddress, transferHash);
    }
}
