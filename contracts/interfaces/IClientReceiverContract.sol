// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IAsterizmEnv.sol";

interface IClientReceiverContract is IAsterizmEnv {

    /// Receive payload from initializer
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function asterizmIzReceive(ClAsterizmReceiveRequestDto calldata _dto) external;

    /// Receive payload from client server
    /// @param _srcChainId uint64  Source chain ID
    /// @param _srcAddress address  Source address
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _dstAddress address  Destination address
    /// @param _nonce uint  Nonce
    /// @param _txId uint  Transaction ID
    /// @param _transferHash bytes32  Transfer hash
    /// @param _payload bytes  Payload
    function asterizmClReceive(uint64 _srcChainId, address _srcAddress, uint64 _dstChainId, address _dstAddress, uint _nonce, uint _txId, bytes32 _transferHash, bytes calldata _payload) external;
}
