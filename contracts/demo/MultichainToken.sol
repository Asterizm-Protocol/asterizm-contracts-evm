// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/IInitializerSenderV2.sol";
import "../interfaces/IMultiChainToken.sol";
import "../base/AsterizmClient.sol";

contract MultichainToken is IMultiChainToken, ERC20, AsterizmClient {

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

    mapping (uint => CrossChainTransfer) public crosschainTransfers;

    constructor(IInitializerSenderV2 _initializerLib, uint _initialSupply)
    ERC20("CrossToken", "CTN")
    AsterizmClient(_initializerLib, true, false)
    {
        _mint(_msgSender(), _initialSupply);
    }

    /// Cross-chain transfer
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _from address  From address
    /// @param _to address  To address
    function crossChainTransfer(uint64 _dstChainId, address _from, address _to, uint _amount) public payable {
        uint amount = _debitFrom(_from, _amount); // amount returned should not have dust
        require(amount > 0, "MultichainToken: amount too small");
        _initAsterizmTransferEvent(_dstChainId, abi.encode(_to, amount, _getTxId()));
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (address dstAddress, uint amount, ) = abi.decode(_dto.payload, (address, uint, uint));
        _mint(dstAddress, amount);
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (address dstAddress, uint amount, uint txId) = abi.decode(_payload, (address, uint, uint));
        
        return abi.encodePacked(dstAddress, amount, txId);
    }

    /// Debit logic
    /// @param _from address  From address
    /// @param _amount uint  Amount
    function _debitFrom(address _from, uint _amount) internal virtual returns(uint) {
        address spender = _msgSender();
        if (_from != spender) _spendAllowance(_from, spender, _amount);
        _burn(_from, _amount);
        return _amount;
    }
}
