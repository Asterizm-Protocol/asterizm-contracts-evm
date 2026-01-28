// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Staking token interface
interface IStakingToken is IERC20 {

    /// Cross-chain unstaking
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _fromAddress address  Address from
    /// @param _toAddress bytes  Destination address in bytes
    /// @param _stakeId uint  Staking ID
    function crossChainUnstake(uint64 _dstChainId, address _fromAddress, bytes memory _toAddress, uint _stakeId) external payable;
}
