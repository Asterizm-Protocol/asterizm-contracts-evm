// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// Multichain token interface
interface IMultiChainToken {

    /// Cross-chain transfer
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _fromAddress address  Address from
    /// @param _toAddress address  Address to
    /// @param _amount uint  Amount
    function crossChainTransfer(uint64 _dstChainId, address _fromAddress, address _toAddress, uint _amount) external payable;
}
