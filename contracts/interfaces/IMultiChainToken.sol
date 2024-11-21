// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// Multichain token interface
interface IMultiChainToken {

    /// Cross-chain transfer
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _fromAddress address  Address from
    /// @param _toAddress uint  Address to in uint format
    /// @param _amount uint  Amount
    function crossChainTransfer(uint64 _dstChainId, address _fromAddress, uint _toAddress, uint _amount) external payable;
}
