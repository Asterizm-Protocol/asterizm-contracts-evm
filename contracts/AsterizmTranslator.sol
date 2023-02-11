// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IInitializerReceiver.sol";
import "./interfaces/INonce.sol";
import "./interfaces/ITranslator.sol";
import "./base/AddressLib.sol";

contract AsterizmTranslator is ITranslator {

    using AddressLib for address;
    using SafeMath for uint;

    struct Chain {
        string title;
        bool exists;
    }

    IInitializerReceiver public endpointContract;
    address public endpoint;
    address public relayer;
    address public owner;
    bool public isLock;
    INonce public outboundNonce;
    INonce public inboundNonce;
    mapping(uint64 => Chain) public chainsMap;
    uint64 public localChainId;

    event Packet(bytes payload);
    event SuccessTransfer();
    event InvalidDst(uint64 indexed srcChainId, address srcAddress, address indexed dstAddress, uint nonce, bytes32 payloadHash);
    event PacketReceived(uint64 indexed srcChainId, address appAddress, address indexed dstAddress, uint nonce, uint transactionId, bytes32 payloadHash);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyEndpoint() {
        require(address(endpoint) == msg.sender, "Translator: only endpoint");
        _;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Translator: only owner");
        _;
    }

    modifier onlyRelayer() {
        if (isLock) {
            require(relayer == msg.sender, "Translator: only relayer");
        }
        _;
    }

    /** Internal logic */

    function setOwner(address _owner) public onlyOwner {
        owner = _owner;
    }

    function setOutBoundNonce(INonce _nonce) public onlyOwner {
        outboundNonce = _nonce;
    }

    function setInBoundNonce(INonce _nonce) public onlyOwner {
        inboundNonce = _nonce;
    }

    function setRelayer(address _relayer) public onlyOwner {
        relayer = _relayer;
        setIsLock(true);
    }

    function setEndpoint(IInitializerReceiver _initializerReceiver) public onlyOwner {
        endpoint = address(_initializerReceiver);
        endpointContract = _initializerReceiver;
    }

    function setIsLock(bool _isLock) public onlyOwner {
        isLock = _isLock;
    }

    function addChain(uint64 _chainId, string memory _title) public onlyOwner {
        chainsMap[_chainId].title = _title;
        chainsMap[_chainId].exists = true;
    }

    function addChains(uint64[] memory _chainIds, string[] memory _titles) external onlyOwner {
        for (uint i = 0; i < _chainIds.length; i++) {
            addChain(_chainIds[i], _titles[i]);
        }
    }

    function removeChainById(uint64 _chainId) external onlyOwner {
        delete chainsMap[_chainId];
    }

    function setLocalChainId(uint64 _chainId) public onlyOwner {
        require(chainsMap[_chainId].exists, "Translator: chain is not exists");
        localChainId = _chainId;
    }

    /** External logic */

    function send(address _application, uint _nonce, uint64 _dstChainId, address _dstAddress, uint _transactionId, bool _isEncoded, bool _forceOrdered, bool _shouldCheckFee, bytes calldata _payload) external payable onlyEndpoint {
        require(chainsMap[_dstChainId].exists, "Translator: wrong chain id");
        if (msg.value > 0) {
            (bool success, ) = owner.call{value: msg.value}("");
            require(success, "Translator: transfer error");
        }

        uint nonce = outboundNonce.increaseNonce(_dstChainId, abi.encodePacked(_dstAddress));
        bytes memory packet = abi.encode(
            nonce, localChainId, _application, _dstChainId,
            _dstAddress, _transactionId, msg.value, _isEncoded,
            _forceOrdered, _shouldCheckFee, _payload
        );
        if (_dstChainId == localChainId) {
            if (_isEncoded) {
                internalTranslateEncodedMessage(gasleft(), packet);
            } else {
                internalTranslateMessage(gasleft(), packet);
            }

            emit SuccessTransfer();
            return;
        }

        emit Packet(packet);
    }

    function internalTranslateMessage(uint _gasLimit, bytes memory _payload) private {
        baseTranslateMessage(_gasLimit, _payload, false);
    }

    function internalTranslateEncodedMessage(uint _gasLimit, bytes memory _payload) private {
        baseTranslateMessage(_gasLimit, _payload, true);
    }

    function translateMessage(uint _gasLimit, bytes calldata _payload) external onlyRelayer {
        baseTranslateMessage(_gasLimit, _payload, false);
    }

    function translateEncodedMessage(uint _gasLimit, bytes calldata _payload) external onlyRelayer {
        baseTranslateMessage(_gasLimit, _payload, true);
    }

    function baseTranslateMessage(uint _gasLimit, bytes memory _payload, bool _useEncode) private {
        (
            uint nonce, uint64 srcChainId, address appAddress, uint64 dstChainId,
            address dstAddress, uint transactionId, , bool isEncoded,
            bool forceOrdered, , bytes memory payload
        ) = abi.decode(
            _payload,
            (uint, uint64, address, uint64, address, uint, uint, bool, bool, bool, bytes)
        );

        if (_useEncode) {
            require(isEncoded, "Translator: translateMessage required");
        } else {
            require(!isEncoded, "Translator: translateEncodedMessage required");
        }

        require(dstChainId == localChainId, "Translator: wrong chain id");

        if (!dstAddress.isContract()) {
            emit InvalidDst(srcChainId, appAddress, dstAddress, nonce, keccak256(payload));
            return;
        }

        if (forceOrdered) {
            bytes memory pathData = abi.encodePacked(appAddress, dstAddress);
            require(inboundNonce.increaseNonceWithValidation(srcChainId, nonce, pathData) == nonce, "Translator: wrong nonce");
        }

        uint gasLimit = _gasLimit;
        emit PacketReceived(srcChainId, appAddress, dstAddress, nonce, transactionId, keccak256(payload));
        if (_useEncode) {
            endpointContract.receiveEncodedPayload(srcChainId, appAddress, dstAddress, nonce, gasLimit, transactionId, forceOrdered, payload);
        } else {
            endpointContract.receivePayload(srcChainId, appAddress, dstAddress, nonce, gasLimit, transactionId, forceOrdered, payload);
        }
    }
}
