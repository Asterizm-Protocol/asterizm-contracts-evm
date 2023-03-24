// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IAsterizmEnv.sol";

/// Translator interface
interface ITranslator is IAsterizmEnv {

    /// Send transfer payload
    /// @param _dto TrSendMessageRequestDto  Method DTO
    function sendMessage(TrSendMessageRequestDto calldata _dto) external payable;

    /// Return local chain id
    /// @return uint64
    function getLocalChainId() external view returns(uint64);
}