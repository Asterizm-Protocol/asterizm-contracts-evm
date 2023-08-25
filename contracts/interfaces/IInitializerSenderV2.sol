// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IAsterizmEnv.sol";

/// Initializer sender V2 interface
interface IInitializerSenderV2 is IAsterizmEnv {

    /// Initiate asterizm transfer
    /// @param _dto IzIninTransferRequestDto  Method DTO
    function initTransfer(IzIninTransferRequestDto calldata _dto) external payable;

    /// Initiate asterizm transfer V2
    /// @param _dto IzIninTransferV2RequestDto  Method DTO
    function initTransferV2(IzIninTransferV2RequestDto calldata _dto) external payable;

    /// Validate income transfer by hash
    /// @param _transferHash bytes32
    function validIncomeTransferHash(bytes32 _transferHash) external view returns(bool);

    /// Return local chain id
    /// @return uint64
    function getLocalChainId() external view returns(uint64);

    /// Return chain type by id
    /// @param _chainId  Chain id
    /// @return uint8  Chain type
    function getChainType(uint64 _chainId) external view returns(uint8);

    /// Resend failed by fee amount transfer
    /// @param _transferHash bytes32  Transfer hash
    function resendTransfer(bytes32 _transferHash) external payable;

    /// Resend failed by fee amount transfer
    /// @param _transferHash bytes32  Transfer hash
    /// @param _relay address  Relay address
    function resendTransferV2(bytes32 _transferHash, address _relay) external payable;
}