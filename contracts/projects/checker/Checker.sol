// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AsterizmClient, IInitializerSender} from "../../base/AsterizmClient.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Checker is AsterizmClient {
    
    event SendCheckerTextEvent(uint _text, uint64[] _chainIds);
    event ReceiveCheckerTextEvent(uint _text, bool _result);

    uint public morseText;

    constructor (IInitializerSender _initializerLib) AsterizmClient(_initializerLib, false, false) Ownable(_msgSender()) {
        morseText = 10100000010101010010; // -.-. .... . -.-. -.- . .-.
    }

    /// Send check
    /// @param _dstChainIds uint64[]  Destination chain IDs
    function sendCheck(uint64[] memory _dstChainIds) public payable onlyOwner {
        bytes memory payload = abi.encode(morseText);
        for (uint i = 0; i < _dstChainIds.length; i++) {
            _initAsterizmTransferEvent(_dstChainIds[i], payload);
        }

        emit SendCheckerTextEvent(morseText, _dstChainIds);
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (uint text) = abi.decode(_dto.payload, (uint));
        emit ReceiveCheckerTextEvent(text, text == morseText);
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (uint text) = abi.decode(_payload, (uint));

        return abi.encodePacked(text);
    }
}
