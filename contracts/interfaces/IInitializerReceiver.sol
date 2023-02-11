// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IInitializerReceiver {
    function receivePayload(uint64 _srcChainId, address _srcPath, address _dstAddress, uint _nonce, uint _gasLimit, uint _transactionId, bool _forceOrdered, bytes calldata _payload) external;
    function receiveEncodedPayload(uint64 _srcChainId, address _srcPath, address _dstAddress, uint _nonce, uint _gasLimit, uint _transactionId, bool _forceOrdered, bytes calldata _payload) external;
}
