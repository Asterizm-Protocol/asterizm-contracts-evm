# [Translator Contract](./contracts/AsterizmTranslatorV1.sol)

## Purpose
The Translator Contract is designed to facilitate the replication of events on one blockchain and broadcast them to another. It serves as an intermediary that receives either encrypted or unencrypted transactions from the Initializer Contract.

## Key Variables
- `initializerLib`: The address of the Initializer Contract
- `relayers`: List of relayers address responsible for this particular blockchain
- `chains`: Available chains map
- `localChainId`: Local chain ID

## Key Methods
- `sendMessage`: Sends a message to another blockchain (initiate event for Asterizm translator)
- `transferMessage`: Translates a message from a relay into the Initializer Contract

# [Initializer Contract](./contracts/AsterizmInitializerV1.sol)

## Purpose
The Initializer Contract serves as a proxy for Asterizm-compatible application events to a Translator Contract.
The Initializer Contract is responsible for receiving encrypted or unencrypted transactions from the Client Contract.

## Execution Modes
This contract can be executed in either strict sequential or parallel mode.
In the strict sequential mode, the Initializer Contract employs the [Nonce Contract](./contracts/AsterizmNonce.sol), where a unique nonce is tracked for each Asterizm-compatible application and each user who initiates the transaction.
In parallel mode, the Client Server in the recipient chain is responsible for maintaining the order of execution.

## Key Variables
- `translator`: The address of the Translator Contract
- `blockAddresses`: Blocking address list map that can not call `initTransfer`, `receivePayload` and `receiveEncryptedPayload` methods
- `sendedTransfers`: Sent transfers list map that was transferred through initializer (successIncome - transfer success income, successOutgoing - transfer success outgoing)

## Key Methods
- `initTransfer`: A method to send messages to the Translator Contract
- `receivePayload`: A method to receive and process public data from the Translator Contract
- `validIncomeTarnsferHash`: A method to validate transfers that were income in initializer
- `validOutgoingTarnsferHash`: A method to validate transfers that were successfully outgoing from initializer

# [Client Contract](./contracts/base/AsterizmClientUpgradeable.sol)
## Purpose:
The Client Contract is responsible for receiving and processing events from other blockchains. A single contract can handle both sending and receiving logic, or two separate contracts can be utilized for these functions. If only one direction of message processing is needed, the relevant base methods can be overridden.

## Data Processing:
In the encrypted data mode, the contract first receives encrypted bytecode. After the encrypted bytecode has been processed by the client server, the decrypted data is received by the contract and processed according to its logic. In the case of working with unencrypted data, the first step is omitted and the contract immediately processes the received bytecode according to its logic.

## Key Variables:
- `initializer`: The address of the Initializer Contract
- `txId`: Internal transaction ID
- `trustedSrcAddresses`: List ot trusted source addresses. You need to add your own contract addresses in all chains to ensure transfers are not tampered with!
- `admins`: Additional addresses list who can execute some internal functions
- `transfers`: Transfers hash list for internal checking logic

## Base Contract Methods:
- `asterizmIzReceive`: This method is receiving transfers from initializer.
- `asterizmClReceive`: This method is receiving transfers from client server (for encryption logic).
- `initAsterizmTransfer`: This external method is responsible for sending messages to the Initializer Contract.
- `_initAsterizmTransferInternal`: This internal method is responsible for sending messages to the Initializer Contract (for non-encryption logic).
- `_initAsterizmTransferEvent`: This method generates the event that will be considered by the client server.
- `_asterizmReceive`: This virtual internal method is responsible for receiving data from the Initializer Contract.


# Integration

To integrate with the Asterizm Protocol, you need to implement a contract that will inherit from the [AsterizmClient](./contracts/base/AsterizmClient.sol) or [AsterizmClientUpgradeable](./contracts/base/AsterizmClientUpgradeable.sol).

These abstract contracts already has all the necessary methods for receiving and sending messages to the initializer contract. To receive messages, the only method you need to implement is the `_asterizmReceive` internal method. This method accepts `ClAsterizmReceiveRequestDto` structure with following parameters:

- `srcChainId` (`uint64`): The ID of the chain from which the message was sent
- `srcAddress` (`uint256`): The sender's address from the source chain
- `dstChainId` (`uint64`): The ID of destination (current) chain
- `dstAddress` (`uint256`): The address from destination (current) chain
- `txId` (`uint256`): The transaction ID
- `transferHash` (`bytes32`): The transfer hash
- `payload` (`bytes`): The bytecode that contains the parameters passed when the method was called in the source chain

You can process all or some of these parameters according to your needs.

To allow the client server to read and encrypt data from your contract, you need to call the `_initAsterizmTransferEvent` method and pass the following parameters:

- `dstChainId`: The ID of destination (current) chain
- `payload`: The bytecode that contains the parameters passed when the method was called in the source chain

After the client server encrypts the transaction payload, the `initAsterizmTransfer` method will be called, which will pass the payload to the initializer contract.


You can see an example of using the methods in [AsterizmDemo](./contracts/demo/AsterizmDemo.sol).

Here is an example of initiation transfer `string` message:

```solidity
function sendMessage(uint64 _dstChainId, string calldata _message) public payable {
    _initAsterizmTransferEvent(_dstChainId, abi.encode(_message));
}
```

Receive message in target network example:

```solidity
string public externalChainMessage;

function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
    string memory _message = abi.decode(_dto.payload, (string));
    // your logic here
}
```
