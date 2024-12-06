// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Multichain token interface
interface IMultiChainToken is IERC20 {

    /// Cross-chain transfer
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _fromAddress address  Address from
    /// @param _toAddress uint  Address to in uint format
    /// @param _amount uint  Amount
    function crossChainTransfer(uint64 _dstChainId, address _fromAddress, uint _toAddress, uint _amount) external payable;
}
