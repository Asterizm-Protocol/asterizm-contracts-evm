// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {AsterizmErrors} from "./AsterizmErrors.sol";

abstract contract AsterizmSenderUpgradeable is OwnableUpgradeable {

    error CustomError(uint16 _errorCode);

    /// Add sender event
    /// @param _sender address  Sender address
    event AddSenderEvent(address _sender);

    /// Remove sender event
    /// @param _sender address  Sender address
    event RemoveSenderEvent(address _sender);

    /// Sender struct
    /// @param exists bool  Is sender exists flag
    struct Sender {
        bool exists;
    }

    mapping(address => Sender) internal senders;
    uint[50] private __gap;

    /// Only sender modifier
    modifier onlySender {
        require(senders[msg.sender].exists, CustomError(AsterizmErrors.SENDER__ONLY_SENDER__ERROR));
        _;
    }

    /// Only sender or owner modifier
    modifier onlySenderOrOwner {
        require(msg.sender == owner() || senders[msg.sender].exists, CustomError(AsterizmErrors.SENDER__ONLY_SENDER_OR_OWNER__ERROR));
        _;
    }

    /// Add sender (internal)
    /// @param _sender address  Sender address
    function _addSender(address _sender) internal {
        senders[_sender].exists = true;
        emit AddSenderEvent(_sender);
    }

    /// Add sender
    /// @param _sender address  Sender address
    function addSender(address _sender) public onlyOwner {
        _addSender(_sender);
    }

    /// Remove sender (internal)
    /// @param _sender address  Sender address
    function _removeSender(address _sender) internal {
        require(senders[_sender].exists, "ERRS03");
        senders[_sender].exists = false;
        emit RemoveSenderEvent(_sender);
    }

    /// Remove sender (external)
    /// @param _sender address  Sender address
    function removeSender(address _sender) external onlyOwner {
        _removeSender(_sender);
    }
}
