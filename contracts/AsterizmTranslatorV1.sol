// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IInitializerReceiver.sol";
import "./interfaces/ITranslator.sol";
import "./libs/AddressLib.sol";
import "./libs/UintLib.sol";
import "./base/AsterizmEnv.sol";
import "./base/AsterizmChainEnv.sol";

contract AsterizmTranslatorV1 is UUPSUpgradeable, OwnableUpgradeable, ITranslator, AsterizmEnv, AsterizmChainEnv {

    using AddressLib for address;
    using UintLib for uint;
    using SafeMathUpgradeable for uint;

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
    event SuccessTransferEvent();

    /// Withdraw event
    /// @param _target address
    /// @param _amount uint
    event WithdrawEvent(address _target, uint _amount);

    /// Transfer send event
    /// @param _srcChainId uint64  Source chain ID
    /// @param _srcAddress uint  Source address
    /// @param _dstAddress uint  Destination address
    /// @param _nonce uint  Nonce
    /// @param _transferHash bytes32  Transfer hash
    /// @param _payloadHash  bytes32  Payload hash
    event TransferSendEvent(uint64 indexed _srcChainId, uint indexed _srcAddress, uint indexed _dstAddress, uint _nonce, bytes32 _transferHash, bytes32 _payloadHash);

    struct Chain {
        bool exists;
        uint8 chainType; // 1 - EVM, 2 - TVM
    }
    struct Relayer {
        bool exists;
    }

    IInitializerReceiver private initializerLib;
    mapping(address => Relayer) private relayers;
    mapping(uint64 => Chain) public chains;
    uint64 public localChainId;

    /// Initializing function for upgradeable contracts (constructor)
    /// @param _localChainId uint64  Local chain ID
    /// @param _localChainType uint8  Local chain type
    function initialize(uint64 _localChainId, uint8 _localChainType) initializer public {
        __Ownable_init();
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
        require(msg.sender == address(initializerLib), "Translator: only initializer");
        _;
    }

    /// Only relayer modifier
    modifier onlyRelayer() {
        require(relayers[msg.sender].exists, "Translator: only relayer");
        _;
    }

    /** Internal logic */

    /// Withdraw coins
    /// @param _target address  Target address
    /// @param _amount uint  Amount
    function withdraw(address _target, uint _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Translator: coins balance not enough");
        (bool success, ) = _target.call{value: _amount}("");
        require(success, "Translator: transfer error");
        emit WithdrawEvent(_target, _amount);
    }

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
        require(_isChainTypeAwailable(_chainType), "Translator: chain type is unavailable");
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
        require(localChainId != _chainId, "Translator: removing local chain");
        delete chains[_chainId];
        emit RemoveChainEvent(_chainId);
    }

    /// Set local chain
    /// @param _chainId uint64  Chain ID
    function _setLocalChainId(uint64 _chainId) private onlyOwner {
        require(chains[_chainId].exists, "Translator: chain is not exists");
        localChainId = _chainId;
        emit SetLocalChainEvent(_chainId);
    }

    /** External logic */

    /// Return local chain id
    /// @return uint64
    function getLocalChainId() external view returns(uint64) {
        return localChainId;
    }

    /// Return chain type by id
    /// @param _chainId  Chain id
    /// @return uint8  Chain type
    function getChainType(uint64 _chainId) external view returns(uint8) {
        require(chains[_chainId].exists, "Translator: chain not found");
        return chains[_chainId].chainType;
    }

    /// Send transfer payload
    /// @param _dto TrSendMessageRequestDto  Method DTO
    function sendMessage(TrSendMessageRequestDto calldata _dto) external payable onlyInitializer {
        require(chains[_dto.dstChainId].exists, "Translator: wrong chain id");
        if (msg.value > 0) {
            (bool success, ) = owner().call{value: msg.value}("");
            require(success, "Translator: transfer error");
        }

        bytes memory payload = abi.encode(
            _dto.nonce, localChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress,
            _dto.forceOrder, _dto.txId, _dto.transferHash, _dto.payload
        );
        if (_dto.dstChainId == localChainId) {
            TrTransferMessageRequestDto memory dto = _buildTrTarnsferMessageRequestDto(gasleft(), payload);
            _internalTransferMessage(dto);
            emit SuccessTransferEvent();
            return;
        }

        emit SendMessageEvent(msg.value, payload);
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
        _baseTransferMessage(_buildTrTarnsferMessageRequestDto(_gasLimit, _payload));
    }

    /// Base transfer message
    /// @param _dto TrTransferMessageRequestDto  Method DTO
    function _baseTransferMessage(TrTransferMessageRequestDto memory _dto) private {
        (
            uint nonce, uint64 srcChainId, uint srcAddress, uint64 dstChainId,
            uint dstAddress, bool forceOrder, uint txId,
            bytes32 transferHash, bytes memory payload
        ) = abi.decode(
            _dto.payload,
            (uint, uint64, uint, uint64, uint, bool, uint, bytes32, bytes)
        );

        {
            require(dstChainId == localChainId, "Translator: wrong chain id");
            require(dstAddress.toAddress().isContract(), "Translator: destination address is non-contract");

            initializerLib.receivePayload(_buildIzReceivePayloadRequestDto(
                    _buildBaseTransferDirectionDto(srcChainId, srcAddress, localChainId, dstAddress),
                    nonce, _dto.gasLimit, forceOrder, txId, transferHash, payload
                ));
        }

        emit TransferSendEvent(srcChainId, srcAddress, dstAddress, nonce, transferHash, keccak256(payload));
    }
}
