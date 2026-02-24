// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// Lending base interface
interface ILendingBase {

    /// Cross-chain unstaking
    /// @param _stakeId uint  Staking ID
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _toAddress bytes  Destination address in bytes
    function crossChainUnstake(uint _stakeId, uint64 _dstChainId, bytes memory _toAddress) external payable;
}
