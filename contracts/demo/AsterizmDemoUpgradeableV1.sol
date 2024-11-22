// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AsterizmClientUpgradeable, IInitializerSender} from "../base/AsterizmClientUpgradeable.sol";

contract AsterizmDemoUpgradeableV1 is AsterizmClientUpgradeable {

    event SetExternalChainMessageEvent(string message);

    string public currentChainMessage;
    string public externalChainMessage;

    /// Initializing function for upgradeable contracts (constructor)
    /// @param _initializerLib IInitializerSender  Initializer library address
    function initialize(IInitializerSender _initializerLib) initializer public {
        __AsterizmClientUpgradeable_init(_initializerLib, true, true);
        currentChainMessage = "Hello from source chain";
        externalChainMessage = "Here is nothing yet";
    }

    /// Set external chain message
    /// @param _message string  Message
    function setExternalChainMessage(string memory _message) internal {
        externalChainMessage = _message;
        emit SetExternalChainMessageEvent(_message);
    }

    /// Send message
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _message string  Message
    function sendMessage(uint64 _dstChainId, string calldata _message) public payable {
        _initAsterizmTransferEvent(_dstChainId, abi.encode(_message));
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        setExternalChainMessage(abi.decode(_dto.payload, (string)));
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (string memory message) = abi.decode(_payload, (string));

        return abi.encodePacked(message);
    }
}
