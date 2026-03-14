// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AsterizmClient, IInitializerSender} from "../../base/AsterizmClient.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CheckerText is AsterizmClient {

    event SendCheckerTextEvent(uint64 _chainId, string text);
    event ReceiveCheckerTextEvent(string _text);

    string public lastText;

    constructor (IInitializerSender _initializerLib) AsterizmClient(_initializerLib, false, false) Ownable(_msgSender()) {}

    /// Send check
    /// @param _dstChainId uint64  Destination chain ID
    function sendCheck(uint64 _dstChainId, string memory text) public payable onlyOwner {
        _initAsterizmTransferEvent(_dstChainId, abi.encode(text));

        emit SendCheckerTextEvent(_dstChainId, text);
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (string memory text) = abi.decode(_dto.payload, (string));
        lastText = text;

        emit ReceiveCheckerTextEvent(text);
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (string memory text) = abi.decode(_payload, (string));

        return abi.encodePacked(text);
    }
}
