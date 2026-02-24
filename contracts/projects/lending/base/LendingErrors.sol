// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library LendingErrors {

    // For Lending contract
    uint16 constant LENDING__ONLY_MODIFIER__ERROR = 10001;
    uint16 constant LENDING__POOL_IS_NOT_SET__ERROR = 10002;
    uint16 constant LENDING__AMOUNT_TOO_SMALL__ERROR = 10003;
    uint16 constant LENDING__STAKE_EXISTS_ALREADY__ERROR = 10004;
    uint16 constant LENDING__STAKE_IS_NOT_EXISTS__ERROR = 10005;
    uint16 constant LENDING__LIQUIDITY_IS_NOT_ENOUGH__ERROR = 10006;
    uint16 constant LENDING__POSITION_IS_CLOSED_ALREADY__ERROR = 10007;
    uint16 constant LENDING__ALLOWANCE_IS_NOT_ENOUGH__ERROR = 10008;
    uint16 constant LENDING__CLIENT_ALLOWANCE_IS_NOT_ENOUGH__ERROR = 10009;
}
