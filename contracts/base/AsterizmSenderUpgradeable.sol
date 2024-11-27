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

    /// Add sender
    /// @param _sender address  Sender address
    function addSender(address _sender) public onlyOwner {
        senders[_sender].exists = true;
        emit AddSenderEvent(_sender);
    }

    /// Remove sender
    /// @param _sender address  Sender address
    function removeSender(address _sender) public onlyOwner {
        require(senders[_sender].exists, CustomError(AsterizmErrors.SENDER__SENDER_NOT_EXISTS__ERROR));
        delete senders[_sender];
        emit RemoveSenderEvent(_sender);
    }
}
