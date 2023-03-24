// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IAsterizmEnv.sol";

interface IClientReceiverContract is IAsterizmEnv {

    /// Receive payload from initializer
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function asterizmIzReceive(ClAsterizmReceiveRequestDto calldata _dto) external;

    /// Receive payload from client server
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function asterizmClReceive(ClAsterizmReceiveRequestDto calldata _dto) external;
}
