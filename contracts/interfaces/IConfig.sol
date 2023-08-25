// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IAsterizmConfigEnv.sol";

/// Config interface
interface IConfig is IAsterizmConfigEnv {

    /// Return relay data
    /// @return ConfigDataResponseDto
    function getRelayData(address _relayAddress) external view returns(ConfigDataResponseDto memory);

    /// Update trusted relay fee
    /// @param _fee uint  Relay fee
    function updateTrustedRelayFee(uint _fee) external;
}
