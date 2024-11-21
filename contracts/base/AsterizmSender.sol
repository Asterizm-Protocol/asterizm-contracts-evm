// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

abstract contract AsterizmSender is Ownable {

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

    /// Only sender modifier
    modifier onlySender {
        require(senders[msg.sender].exists, "AsterizmSender: only sender");
        _;
    }

    /// Only sender or owner modifier
    modifier onlySenderOrOwner {
        require(msg.sender == owner() || senders[msg.sender].exists, "AsterizmSender: only sender or owner");
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
        require(senders[_sender].exists, "AsterizmSender: sender not exists");
        delete senders[_sender];
        emit RemoveSenderEvent(_sender);
    }
}
