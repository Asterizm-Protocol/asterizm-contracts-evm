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

    /// Return chain type by id
    /// @param _chainId  Chain id
    /// @return uint8  Chain type
    function getChainType(uint64 _chainId) external view returns(uint8);
}
