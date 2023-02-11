// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface INonce {
    function increaseNonce(uint64 chId, bytes calldata pathData) external returns (uint);
    function increaseNonceWithValidation(uint64 chId, uint nonce, bytes calldata pathData) external returns (uint);
    function lookUpNonce(uint64 chId, bytes calldata pathData) external returns (uint);
}