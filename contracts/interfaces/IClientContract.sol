// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IClientContract {
    function asterismReceive(uint64 _srcChainId, address _srcAddress, uint _nonce, uint _transactionId, bytes calldata _payload) external;
    function asterismReceiveEncoded(uint64 _srcChainId, address _srcAddress, uint _nonce, uint _transactionId, bytes calldata _payload) external;
}
