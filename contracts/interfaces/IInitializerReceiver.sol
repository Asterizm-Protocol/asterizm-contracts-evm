// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IAsterizmEnv.sol";

/// Initializer receive interface
interface IInitializerReceiver is IAsterizmEnv {

    /// Receive payload from translator
    /// @param _dto IzReceivePayloadRequestDto  Method DTO
    function receivePayload(IzReceivePayloadRequestDto calldata _dto) external;

    /// Receive encrypted payload from translator
    /// @param _dto IzReceivePayloadRequestDto  Method DTO
    function receiveEncryptedPayload(IzReceivePayloadRequestDto calldata _dto) external;
}
