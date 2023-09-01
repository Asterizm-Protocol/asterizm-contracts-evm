// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IAsterizmEnv.sol";
import "./IConfig.sol";

/// Initializer receive interface
interface IInitializerReceiver is IAsterizmEnv, IConfig {

    /// Receive payload from translator
    /// @param _dto IzReceivePayloadRequestDto  Method DTO
    function receivePayload(IzReceivePayloadRequestDto calldata _dto) external;
}
