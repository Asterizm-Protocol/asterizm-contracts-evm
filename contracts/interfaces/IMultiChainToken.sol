// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IMultiChainToken {
    function crossChainTransfer(uint64 destChain, address from, address to, uint amount, address target) external;
}
