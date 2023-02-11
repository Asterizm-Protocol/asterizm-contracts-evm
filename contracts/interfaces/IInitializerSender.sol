// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IInitializerSender {
    function send(uint64 _dstChainId, address _destination, uint _transactionId, bool _isEncoded, bool _forceOrdered, bytes calldata _payload) external payable;
}
