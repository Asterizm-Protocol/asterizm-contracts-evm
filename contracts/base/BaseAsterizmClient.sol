// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IInitializerSender.sol";
import "../interfaces/IClientContract.sol";

abstract contract BaseAsterizmClient is IClientContract {

    IInitializerSender public initializerLib;
    address public initializer;
    address public owner;
    mapping(address => bool) public adminsMap;
    uint public transactionId;
    bool public isEncoded;
    bool public forceOrdered;

    event EncodedPayloadReceived(uint64 _srcChainId, address _srcAddress, uint _nonce, uint _transactionId, bytes _payload);
    event MessageSent(uint64 _dstChainId, address _destination, uint _transactionId, bool _forceOrdered, bytes _payload);

    constructor(IInitializerSender _initializerLib, bool _isEncoded, bool _forceOrdered) {
        owner = msg.sender;
        setInitializer(_initializerLib);
        setIsEncoded(_isEncoded);
        setForceOrdered(_forceOrdered);
    }

    modifier onlyOwner {
        require(msg.sender == owner, "BaseClientInitializer: only owner");
        _;
    }

    modifier onlyOwnerOrAdmin {
        require(msg.sender == owner || adminsMap[msg.sender], "BaseClientInitializer: only owner or admin");
        _;
    }

    modifier onlyOwnerOrInitializer {
        require(msg.sender == owner || msg.sender == initializer, "BaseClientInitializer: only owner or initializer");
        _;
    }

    function setIsEncoded(bool _isEncoded) public onlyOwner {
        isEncoded = _isEncoded;
    }

    function setForceOrdered(bool _forceOrdered) public onlyOwner {
        forceOrdered = _forceOrdered;
    }

    function addAdmin(address _adminAddress) public onlyOwner {
        adminsMap[_adminAddress] = true;
    }

    function removeAdmin(address _adminAddress) public onlyOwner {
        delete adminsMap[_adminAddress];
    }

    function setInitializer(IInitializerSender _initializerLib) public onlyOwnerOrAdmin {
        initializerLib = _initializerLib;
        initializer = address(_initializerLib);
    }

    function asterismReceive(uint64 _srcChainId, address _srcAddress, uint _nonce, uint _transactionId, bytes calldata _payload) public virtual onlyOwnerOrInitializer {}

    function asterismReceiveEncoded(uint64 _srcChainId, address _srcAddress, uint _nonce, uint _transactionId, bytes calldata _payload) public virtual onlyOwnerOrInitializer {
        emit EncodedPayloadReceived(_srcChainId, _srcAddress, _nonce, _transactionId, _payload);
    }

    function _sendMessage(uint64 destChain, address destAddress, uint _transactionId, bytes calldata payload) public payable virtual onlyOwnerOrInitializer {
        initializerLib.send{value: msg.value} (
            destChain,
            destAddress,
            _transactionId,
            isEncoded,
            forceOrdered,
            payload
        );
    }

    function _generateSendingEvent(uint64 dstChainId, address destination, bytes memory payload) internal virtual {
        emit MessageSent(dstChainId, destination, transactionId++, forceOrdered, payload);
    }

    function _sendDataToInitializer(uint64 destChain, address destAddress, uint _feeAmount, bytes memory payload) internal virtual {
        initializerLib.send{value: _feeAmount} (
            destChain,
            destAddress,
            transactionId++,
            isEncoded,
            forceOrdered,
            payload
        );
    }
}
