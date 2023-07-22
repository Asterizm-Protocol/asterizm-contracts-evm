// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IGasStationValidator {

    /// Calculate and validate sent sum
    /// @param _amounts uint[]  Amounts
    /// @param _token IERC20  Token
    function calcSendingAmount(uint[] memory _amounts, IERC20 _token) external view returns(uint, uint8);
}
