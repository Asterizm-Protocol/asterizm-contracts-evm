// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Lending pool interface
interface ILendingPool {

    /// Send liquidity
    /// @param _stakeId uint  Staking ID
    /// @param _targetAddress address  Target address
    /// @param _amount uint  Amount
    function sendLiquidity(uint _stakeId, address _targetAddress, uint _amount) external;

    /// Close position
    /// @param _stakeId uint  Staking ID
    function closePosition(uint _stakeId) external;

    /// Return liquid token
    /// @return IERC20
    function getLiquidToken() external returns(IERC20);
}
