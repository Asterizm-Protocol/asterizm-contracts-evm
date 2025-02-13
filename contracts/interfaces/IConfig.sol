// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAsterizmConfigEnv} from "./IAsterizmConfigEnv.sol";

interface IConfig is IAsterizmConfigEnv {
    
    /// Update trusted relay fee
    /// @param _fee uint  Relay fee
    function updateTrustedRelayFee(uint _fee) external;
}
