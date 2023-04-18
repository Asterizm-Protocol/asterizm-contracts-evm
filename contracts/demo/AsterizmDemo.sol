// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../base/BaseAsterizmClient.sol";

contract AsterizmDemo is BaseAsterizmClient {

    event SetExternalChainMessageEvent(string message);

    string public currentChainMessage;
    string public externalChainMessage;

    constructor (IInitializerSender _initializerLib) BaseAsterizmClient(_initializerLib, true, false) {
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
    /// @param _dstAddress address  Destination address
    /// @param _message string  Message
    function sendMessage(uint64 _dstChainId, address _dstAddress, string calldata _message) public payable {
        _initAsterizmTransferEvent(_buildClInitTransferEventDto(_dstChainId, _dstAddress, abi.encode(_message)));
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        setExternalChainMessage(abi.decode(_dto.payload, (string)));
    }
}
