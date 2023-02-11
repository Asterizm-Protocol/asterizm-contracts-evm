// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/INonce.sol";
import "./interfaces/ITranslator.sol";
import "./interfaces/IClientContract.sol";
import "./interfaces/IInitializerSender.sol";
import "./interfaces/IInitializerReceiver.sol";

contract AsterizmInitializer is IInitializerSender, IInitializerReceiver {

    struct StoredPayload {
        uint64 payloadLength;
        address dstAddress;
        bytes32 payloadHash;
    }

    struct Client {
        address clientAddress;
        bool shouldCheckFee;
        bool exists;
    }

    INonce public inboundNonce;
    INonce public outboundNonce;
    mapping(uint64 => mapping(bytes => StoredPayload)) public storedPayload;
    mapping(address => Client) public clients;
    ITranslator public translatorLibrary;
    address public translator;
    address public owner;
    bool public availableForAllClients;
    bool public isDecSendAvailable;
    bool public isEncSendAvailable;

    event PayloadCleared(uint64 srcChainId, bytes srcAddress, uint nonce, uint transactionId, address dstAddress);
    event PayloadStored(uint64 srcChainId, bytes srcAddress, address dstAddress, uint nonce, uint transactionId, bytes payload, bytes reason);

    constructor (ITranslator _translatorLibrary) {
        owner = msg.sender;
        setTransalor(_translatorLibrary);
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "AsterizmInitializer: only owner");
        _;
    }

    modifier onlyTranslator() {
        require(translator == msg.sender, "AsterizmInitializer: only translator");
        _;
    }

    modifier onlyClient() {
        if (!availableForAllClients) {
            require(clients[msg.sender].exists, "AsterizmInitializer: only client");
        }
        _;
    }

    /** Internal logic */

    function setOwner(address _owner) public onlyOwner {
        owner = _owner;
    }

    function setTransalor(ITranslator _translatorLibrary) public onlyOwner {
        translator = address(_translatorLibrary);
        translatorLibrary = _translatorLibrary;
    }

    function setOutBoundNonce(INonce _nonce) public onlyOwner {
        outboundNonce = _nonce;
    }

    function setInBoundNonce(INonce _nonce) public onlyOwner {
        inboundNonce = _nonce;
    }

    function setAvailableForAll(bool _value) public onlyOwner {
        availableForAllClients = _value;
    }

    function addClient(address clientAddress, bool shouldCheckFee) public onlyOwner {
        clients[clientAddress].clientAddress = clientAddress;
        clients[clientAddress].shouldCheckFee = shouldCheckFee;
        clients[clientAddress].exists = true;
    }

    function removeClient(address clientAddress) public onlyOwner {
        delete clients[clientAddress];
    }

    function setIsDecSendAvailable(bool _value) public onlyOwner {
        isDecSendAvailable = _value;
    }

    function setIsEncSendAvailable(bool _value) public onlyOwner {
        isEncSendAvailable = _value;
    }

    /** External logic */

    function send(uint64 _dstChainId, address _destination, uint _transactionId, bool _isEncoded, bool _forceOrdered, bytes calldata _payload) external payable onlyClient {
        _isEncoded ? require(isEncSendAvailable, "AsterizmInitializer: encode transfer is unavailable") : require(isDecSendAvailable, "AsterizmInitializer: decode transfer is unavailable");
        uint nonce = outboundNonce.increaseNonce(_dstChainId, abi.encodePacked(msg.sender));
        translatorLibrary.send{value: msg.value}(msg.sender, nonce, _dstChainId, _destination, _transactionId, _isEncoded, _forceOrdered, clients[msg.sender].shouldCheckFee, _payload);
    }

    function receivePayload(uint64 _srcChainId, address _application, address _dstAddress, uint _nonce, uint _gasLimit, uint _transactionId, bool _forceOrdered, bytes calldata _payload) external onlyTranslator {
        bytes memory _srcPath = abi.encodePacked(_application, _dstAddress);
        if (_forceOrdered) {
            require(inboundNonce.increaseNonceWithValidation(_srcChainId, _nonce, _srcPath) == _nonce, "AsterizmInitializer: wrong nonce");
        }

        StoredPayload storage sp = storedPayload[_srcChainId][_srcPath];
        require(sp.payloadHash == bytes32(0), "AsterizmInitializer: in message blocking");
        require(_dstAddress != address(this) && _dstAddress != msg.sender, "AsterizmInitializer: wrong destination address");

        try IClientContract(_dstAddress).asterismReceive{gas: _gasLimit}(_srcChainId, _application, _nonce, _transactionId, _payload) {
        } catch (bytes memory reason) {
            storedPayload[_srcChainId][_srcPath] = StoredPayload(uint64(_payload.length), _dstAddress, keccak256(_payload));
            emit PayloadStored(_srcChainId, _srcPath, _dstAddress, _nonce, _transactionId, _payload, reason);
        }
    }

    function receiveEncodedPayload(uint64 _srcChainId, address _application, address _dstAddress, uint _nonce, uint _gasLimit, uint _transactionId, bool _forceOrdered, bytes calldata _payload) external onlyTranslator {
        bytes memory _srcPath = abi.encodePacked(_application, _dstAddress);
        if (_forceOrdered) {
            require(inboundNonce.increaseNonceWithValidation(_srcChainId, _nonce, _srcPath) == _nonce, "AsterizmInitializer: wrong nonce");
        }

        StoredPayload storage sp = storedPayload[_srcChainId][_srcPath];
        require(sp.payloadHash == bytes32(0), "AsterizmInitializer: in message blocking");
        require(_dstAddress != address(this) && _dstAddress != msg.sender, "AsterizmInitializer: wrong destination address");

        try IClientContract(_dstAddress).asterismReceiveEncoded{gas: _gasLimit}(_srcChainId, _application, _nonce, _transactionId, _payload) {
        } catch (bytes memory reason) {
            storedPayload[_srcChainId][_srcPath] = StoredPayload(uint64(_payload.length), _dstAddress, keccak256(_payload));
            emit PayloadStored(_srcChainId, _srcPath, _dstAddress, _nonce, _transactionId, _payload, reason);
        }
    }

    function retryPayload(uint64 _srcChainId, address _application, address _dstAddress, uint _gasLimit, uint _transactionId, bool _isEncoded, bytes calldata _payload) external {
        bytes memory _srcPath = abi.encodePacked(_application, _dstAddress);
        StoredPayload storage sp = storedPayload[_srcChainId][_srcPath];
        require(sp.payloadHash != bytes32(0), "AsterizmInitializer: no stored payload");
        require(_payload.length == sp.payloadLength && keccak256(_payload) == sp.payloadHash, "AsterizmInitializer: invalid payload");

        address dstAddress = sp.dstAddress;

        sp.payloadLength = 0;
        sp.dstAddress = address(0);
        sp.payloadHash = bytes32(0);

        uint nonce = inboundNonce.lookUpNonce(_srcChainId, _srcPath);

        if (_isEncoded) {
            IClientContract(dstAddress).asterismReceiveEncoded{gas: _gasLimit}(_srcChainId, _application, nonce, _transactionId, _payload);
        } else {
            IClientContract(dstAddress).asterismReceive{gas: _gasLimit}(_srcChainId, _application, nonce, _transactionId, _payload);
        }

        emit PayloadCleared(_srcChainId, _srcPath, nonce, _transactionId, dstAddress);
    }
}
