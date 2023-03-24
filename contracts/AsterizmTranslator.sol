// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IInitializerReceiver.sol";
import "./interfaces/INonce.sol";
import "./interfaces/ITranslator.sol";
import "./base/BaseAsterizmEnv.sol";

contract AsterizmTranslator is Ownable, ITranslator, BaseAsterizmEnv {

    using Address for address;
    using SafeMath for uint;

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
    event AddChainEvent(uint64 _chainId);

    /// Remove chain event
    /// @param _chainId uint64
    event RemoveChainEvent(uint64 _chainId);

    /// Set local chain event
    /// @param _chainId uint64
    event SetLocalChainEvent(uint64 _chainId);

    /// Send message event
    /// @param _payload bytes  Transfer payload
    event SendMessageEvent(bytes _payload);

    /// Success transfer event
    event SuccessTransferEvent();

    /// Transfer send event
    /// @param _srcChainId uint64  Source chain ID
    /// @param _srcAddress address  Source address
    /// @param _dstAddress address  Destination address
    /// @param _nonce uint  Nonce
    /// @param _transferHash bytes32  Transfer hash
    /// @param _payloadHash  bytes32  Payload hash
    event TransferSendEvent(uint64 indexed _srcChainId, address indexed _srcAddress, address indexed _dstAddress, uint _nonce, bytes32 _transferHash, bytes32 _payloadHash);

    struct Chain {
        bool exists;
    }
    struct Relayer {
        bool exists;
    }

    IInitializerReceiver private initializerLib;
    mapping(address => Relayer) private relayers;
    mapping(uint64 => Chain) public chains;
    uint64 public localChainId;

    constructor (uint64 _localChainId) {
        addRelayer(owner());
        addChain(_localChainId);
        _setLocalChainId(_localChainId);
    }

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
    function addChain(uint64 _chainId) public onlyOwner {
        chains[_chainId].exists = true;
        emit AddChainEvent(_chainId);
    }

    /// Add chains list
    /// @param _chainIds uint64[]  Chain IDs
    function addChains(uint64[] calldata _chainIds) public onlyOwner {
        for (uint i = 0; i < _chainIds.length; i++) {
            addChain(_chainIds[i]);
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
            msg.value, _dto.useEncryption, _dto.forceOrder, _dto.txId, _dto.transferHash, _dto.payload
        );
        if (_dto.dstChainId == localChainId) {
            TrTransferMessageRequestDto memory dto = _buildTrTarnsferMessageRequestDto(gasleft(), payload);
            _internalTransferMessage(dto);
            emit SuccessTransferEvent();
            return;
        }

        emit SendMessageEvent(payload);
    }

    /// Initernal transfer message (for transfers in one chain)
    /// @param _dto TrTransferMessageRequestDto  Method DTO
    function _internalTransferMessage(TrTransferMessageRequestDto memory _dto) private {
        baseTransferMessage(_dto);
    }

    /// Initernal transfer message
    /// @param _dto TrTransferMessageRequestDto  Method DTO
    function transferMessage(TrTransferMessageRequestDto calldata _dto) external onlyRelayer {
        baseTransferMessage(_dto);
    }

    /// Base transfer message
    /// @param _dto TrTransferMessageRequestDto  Method DTO
    function baseTransferMessage(TrTransferMessageRequestDto memory _dto) private {
        bytes memory pl = _dto.payload;
        (
            uint nonce, uint64 srcChainId, address srcAddress, uint64 dstChainId,
            address dstAddress, , , bool forceOrder, uint txId,
            bytes32 transferHash, bytes memory payload
        ) = abi.decode(
            pl,
            (uint, uint64, address, uint64, address, uint, bool, bool, uint, bytes32, bytes)
        );

        require(dstChainId == localChainId, "Translator: wrong chain id");
        require(dstAddress.isContract(), "Translator: destination address is non-contract");

        uint gasLimit = _dto.gasLimit;
        IzReceivePayloadRequestDto memory dto = _buildIzReceivePayloadRequestDto(
            _buildBaseTransferDirectionDto(srcChainId, srcAddress, localChainId, dstAddress), nonce, gasLimit, forceOrder, txId, transferHash, payload
        );
        initializerLib.receivePayload(dto);

        emit TransferSendEvent(srcChainId, srcAddress, dstAddress, nonce, transferHash, keccak256(payload));
    }
}
