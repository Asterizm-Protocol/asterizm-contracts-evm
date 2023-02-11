// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IInitializerSender.sol";
import "./interfaces/IClientContract.sol";
import "./interfaces/IMultiChainToken.sol";

contract MultichainToken is ERC20, IClientContract, IMultiChainToken {

    IInitializerSender public initializerLib;
    address public initializer;
    address public owner;
    bool public isEncoded;
    bool public forceOrdered;
    uint public transactionId;

    event EncodedPayloadRecieved(uint64 srcChainId, address srcAddress, uint nonce, uint _transactionId, bytes payload);
    event CrossChainTransferReceived(uint id, uint64 destChain, address from, address to, uint amount, uint _transactionId, address target);
    event CrossChainTransferCompleted(uint id);

    struct CrossChainTransfer {
        bool exists;
        uint64 destChain;
        address from;
        address to;
        uint amount;
        address target;
    }
    uint public transfersCounter;
    mapping (uint => CrossChainTransfer) public transfers;

    constructor(IInitializerSender _initializerLib, uint _initialSupply) ERC20("CrossToken", "CTN") {
        initializerLib = _initializerLib;
        initializer = address(_initializerLib);
        owner = msg.sender;
        _mint(_msgSender(), _initialSupply);
    }

    modifier onlyVerifiedSender {
        require(msg.sender == owner || msg.sender == initializer, "MultichainToken: only verified sender");
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "MultichainToken: only owner");
        _;
    }

    function setOwner(address _owner) public {
        require(msg.sender == owner);
        owner = _owner;
    }

    function crossChainTransfer(uint64 destChain, address from, address to, uint amount, address target) public {
        uint256 transferId = ++transactionId;
        amount = _debitFrom(from, amount); // amount returned should not have dust
        require(amount > 0, "MultichainToken: amount too small");
        _sendMessage(destChain, to, amount, transferId, target);
    }

    function crossChainEncodedTransferFirstStep(uint64 destChain, address from, address to, uint amount, address target) public {
        uint transferId = ++transactionId;
        require(!transfers[transferId].exists, "MultichainToken: transaction already exists");
        transfers[transferId].exists = true;
        transfers[transferId].destChain = destChain;
        transfers[transferId].from = from;
        transfers[transferId].to = to;
        transfers[transferId].amount = amount;
        transfers[transferId].target = target;
        emit CrossChainTransferReceived(transferId, destChain, from, to, amount, transferId, target);
    }

    function crossChainEncodedTransferSecondStep(uint id, bytes calldata payload) public onlyOwner {
        uint amount = _debitFrom(transfers[id].from, transfers[id].amount); // amount returned should not have dust
        require(amount > 0, "MultichainToken: amount too small");
        _sendEncodedMessage(transfers[id].destChain, transfers[id].target, id, payload);
        transfers[id].exists = false;
        emit CrossChainTransferCompleted(id);
    }

    function _sendMessage(uint64 destChain, address destAddress, uint amount, uint _transactionId, address target) internal {
        bytes memory payload = abi.encode(destAddress, amount);
        initializerLib.send(
            destChain,
            target,
            _transactionId,
            isEncoded,
            forceOrdered,
            payload
        );
    }

    function asterismReceive(uint64 _srcChainId, address _srcAddress, uint _nonce, uint _transactionId, bytes calldata _payload) public onlyVerifiedSender {
        (address dstAddress, uint amount) = abi.decode(_payload, (address, uint));
        _creditTo(dstAddress, amount);
    }

    function _debitFrom(address _from, uint _amount) internal virtual returns(uint) {
        address spender = _msgSender();
        if (_from != spender) _spendAllowance(_from, spender, _amount);
        _burn(_from, _amount);
        return _amount;
    }

    function _creditTo(address _toAddress, uint _amount) internal virtual returns(uint) {
        _mint(_toAddress, _amount);
        return _amount;
    }

    // Encoded part
    function _sendEncodedMessage(uint64 destChain, address target, uint _transactionId, bytes calldata payload) internal {
        initializerLib.send(
            destChain,
            target,
            _transactionId,
            isEncoded,
            forceOrdered,
            payload
        );
    }

    function asterismReceiveEncoded(uint64 _srcChainId, address _srcAddress, uint _nonce, uint _transactionId, bytes calldata _payload) public onlyVerifiedSender {
        emit EncodedPayloadRecieved(_srcChainId, _srcAddress, _nonce, _transactionId, _payload);
    }
}
