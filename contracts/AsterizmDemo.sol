// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./base/BaseAsterizmClient.sol";

contract AsterizmDemo is BaseAsterizmClient {

    string public currentChain;
    string public externalChain;

    constructor (IInitializerSender _initializerLib) BaseAsterizmClient(_initializerLib, false, false) {
        currentChain = "Hello from source chain";
        externalChain = "Here is nothing yet";
    }

    function setExternalChainMessage(string memory message) internal {
        externalChain = message;
    }

    function sendMessage(uint64 destChain, address destAddress, string memory message) public payable {
        bytes memory payload = abi.encode(message);
        _sendDataToInitializer(destChain, destAddress, 0, payload);
    }

    function asterismReceive(uint64 _srcChainId, bytes calldata _srcAddress, uint64 _nonce, uint transactionId, bytes calldata _payload) public {
        string memory _externalChain = abi.decode(_payload, (string));
        setExternalChainMessage(_externalChain);
    }
}
