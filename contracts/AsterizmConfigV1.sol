// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IConfig.sol";

/// Asterizm config contract
contract AsterizmConfigV1 is UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, IConfig {

    /// Set initializer event
    /// @param _address address  Initializer address
    event SetInitializerEvent(address _address);

    /// Trusted relay event
    /// @param _initializer address  Update initializer address
    /// @param _relayAddress address  Relay address
    /// @param _fee uint  Relay fee
    /// @param _systemFee uint  System fee
    event TrustedRelayEvent(address _initializer, address _relayAddress, uint _fee, uint _systemFee);

    /// Remove trusted relay event
    /// @param _relayAddress address  Relay address
    event RemoveTrustedRelayEvent(address _relayAddress);

    /// External relay structure
    /// @param exists bool  Is relay exists flag
    /// @param fee uint  Relay fee
    struct Repay {
        bool exists;
        uint fee;
        uint systemFee;
    }

    mapping(address => Repay) private trustedRelays;
    address private initializerAddress;

    /// Initializing function for upgradeable contracts (constructor)
    /// @param _initializerAddress address  Initializer address
    function initialize(address _initializerAddress) initializer public {
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _setInitializer(_initializerAddress);
    }

    /// Upgrade implementation address for UUPS logic
    /// @param _newImplementation address  New implementation address
    function _authorizeUpgrade(address _newImplementation) internal onlyOwner override {}

    /// Only initializer modifier
    modifier onlyInitializer() {
        require(msg.sender == initializerAddress, "AsterismConfig: only initializer");
        _;
    }

    /// Only trusted relay modifier
    modifier onlyTrustedRelay() {
        require(trustedRelays[msg.sender].exists, "AsterismConfig: only trusted relay");
        _;
    }

    /// Set initializer
    /// @param _initializerAddress address  Initializer address
    function _setInitializer(address _initializerAddress) public onlyOwner {
        initializerAddress = _initializerAddress;
        emit SetInitializerEvent(_initializerAddress);
    }

    /// Managing trusted relay
    /// @param _relayAddress address  Relay address
    /// @param _fee uint  Relay fee
    /// @param _systemFee uint  System fee
    function manageTrustedRelay(address _relayAddress, uint _fee, uint _systemFee) external onlyOwner {
        trustedRelays[_relayAddress].exists = true;
        trustedRelays[_relayAddress].fee = _fee;
        trustedRelays[_relayAddress].systemFee = _systemFee;

        emit TrustedRelayEvent(msg.sender, _relayAddress, _fee, _systemFee);
    }

    /// Update trusted relay fee
    /// @param _fee uint  Relay fee
    function updateTrustedRelayFee(uint _fee) external nonReentrant onlyTrustedRelay {
        trustedRelays[msg.sender].fee = _fee;

        emit TrustedRelayEvent(msg.sender, msg.sender, _fee, trustedRelays[msg.sender].systemFee);
    }

    /// Remove trusted relay
    /// @param _relayAddress address  Relay address
    function removeTrustedRelay(address _relayAddress) external onlyOwner {
        require(trustedRelays[_relayAddress].exists, "AsterizmConfig: relay not exists");
        delete trustedRelays[_relayAddress];

        emit RemoveTrustedRelayEvent(_relayAddress);
    }

    /// Return relay data
    /// @return ConfigDataResponseDto
    function getRelayData(address _relayAddress) external view returns(ConfigDataResponseDto memory) {
        ConfigDataResponseDto memory dto;
        dto.externalRelayExists = trustedRelays[_relayAddress].exists;
        dto.externalRelayFee = trustedRelays[_relayAddress].fee;
        dto.systemFee = trustedRelays[_relayAddress].systemFee;

        return dto;
    }
}
