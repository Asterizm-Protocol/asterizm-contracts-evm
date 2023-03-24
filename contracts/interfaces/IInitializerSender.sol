// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IAsterizmEnv.sol";

/// Initializer sender interface
interface IInitializerSender is IAsterizmEnv {

    /// Initiate asterizm transfer
    /// @param _dto IzIninTransferRequestDto  Method DTO
    function initTransfer(IzIninTransferRequestDto calldata _dto) external payable;

    /// Validate income transfer by hash
    /// @param _transferHash bytes32
    function validIncomeTarnsferHash(bytes32 _transferHash) external view returns(bool);

    /// Validate outhoing transfer by hash
    /// @param _transferHash bytes32
    function validOutgoingTarnsferHash(bytes32 _transferHash) external view returns(bool);

    /// Return local chain id
    /// @return uint64
    function getLocalChainId() external view returns(uint64);
}
