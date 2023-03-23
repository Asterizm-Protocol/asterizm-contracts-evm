// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IAsterizmEnv.sol";

interface IClientReceiverContract is IAsterizmEnv {

    /// Receive non-encrypted payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function asterizmReceive(ClAsterizmReceiveRequestDto calldata _dto) external;

    /// Receive encrypted payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function asterizmReceiveEncoded(ClAsterizmReceiveRequestDto calldata _dto) external;
}
