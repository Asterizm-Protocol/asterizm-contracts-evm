// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../base/AsterizmClient.sol";

contract AsterizmDemo is AsterizmClient {

    event SetExternalChainMessageEvent(string message);

    string public currentChainMessage;
    string public externalChainMessage;

    constructor (IInitializerSender _initializerLib) AsterizmClient(_initializerLib, true, false) {
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
}
