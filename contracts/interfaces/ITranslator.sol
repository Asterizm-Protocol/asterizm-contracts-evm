// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ITranslator {
    function send(address _userApplication, uint _lastNonce, uint64 _chainId, address _destination, uint _transactionId, bool _isEncoded, bool _forceOrdered, bool _shouldCheckFee, bytes calldata _payload) external payable;
}