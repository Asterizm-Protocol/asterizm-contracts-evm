// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/INonce.sol";

contract AsterizmNonce is INonce {

    mapping(uint64 => mapping(bytes => uint)) public nonce;
    address public manipulator;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "AsterismNonce: only owner");
        _;
    }

    modifier onlyManipulator() {
        require(manipulator == msg.sender, "AsterismNonce: only manipulator");
        _;
    }

    function setManipulator(address _manipulator) public onlyOwner {
        manipulator = _manipulator;
    }

    function setOwner(address _owner) public onlyOwner {
        owner = _owner;
    }

    function increaseNonceWithValidation(uint64 chId, uint _nonce, bytes calldata pathData) public onlyManipulator returns (uint) {
        uint currentNonce = nonce[chId][pathData];
        require(_nonce == currentNonce + 1, "AsterismNonce: wrong nonce");
        return ++nonce[chId][pathData];
    }

    function increaseNonce(uint64 chId, bytes calldata pathData) public onlyManipulator returns (uint) {
        return ++nonce[chId][pathData];
    }
    
    function forceSetNonce(uint64 chId, uint _nonce, bytes calldata pathData) public onlyOwner returns (uint) {
        nonce[chId][pathData] = _nonce;
        return nonce[chId][pathData];
    }

    function lookUpNonce(uint64 chId, bytes calldata pathData) public view returns (uint) {
        return nonce[chId][pathData];
    }
}
