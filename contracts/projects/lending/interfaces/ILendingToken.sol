// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ILendingBase} from "./ILendingBase.sol";

/// Lending token interface
interface ILendingToken is ILendingBase, IERC20 {}
