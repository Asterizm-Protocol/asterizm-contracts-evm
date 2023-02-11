# Translator Contract

## Purpose
The Translator Contract is designed to facilitate the replication of events on one blockchain and broadcast them to another. It serves as an intermediary that receives either encrypted or unencrypted transactions from the Initializer Contract.

## Execution Modes
The Translator Contract can be executed in either a strict sequential mode or a parallel mode. In the strict sequential mode, the Nonce Contract is utilized to ensure that a separate nonce is counted for each user who initiates the transaction and for each Asrterism-compatible application. In the parallel execution mode, the client server is responsible for maintaining the order of transactions.

## Key Variables
- `endpoint`: The address of the Initializer Contract
- `relayer`: The address of the relayer responsible for this particular blockchain
- `owner`: The address of the contract owner
- `chainsMap`: Available chains map
- `localChainId`: Local chain ID

## Key Methods
- `send`: Sends a message to another blockchain (initiate event for Asterizm translator)
- `translateMessage`: Translates a message from a relay into the Initializer Contract
- `translateEncodedMessage`: Translates an encrypted message from the relay to the Initializer Contract.

_Note_: The differences between `translateMessage` and `translateEncodedMessage` is in the `_isEncoded` parameter, which is passed from the client contract.

# Initializer Contract

## Purpose
The Initializer Contract serves as a proxy for Asterism-compatible application events to a Translator Contract.
The Initializer Contract is responsible for receiving encrypted or unencrypted transactions from the Client Contract.

## Execution Modes
This contract can be executed in either strict sequential or parallel mode.
In the strict sequential mode, the Translator Contract employs the Nonce Contract, where a unique nonce is tracked for each Asterism-compatible application and each user who initiates the transaction.
In parallel mode, the Client Server in the recipient chain is responsible for maintaining the order of execution.

## Key Variables
- `translator`: The address of the Translator Contract
- `owner`: The address of the contract owner
- `clients`: Available clients map that can call `send` method. Contact us to add your contract to this list
- `availableForAll`: Flag for disable clients validation (true - method `send` available for any contracts, test mode)
- `isDecSendAvailable`: Flag for available sending decoded messages
- `isEncSendAvailable`: Flag for available sending encoded messages

## Key Methods
- `send`: A method to send messages to the Translator Contract
- `receivePayload`: A method to receive and process public data from the Translator Contract
- `receiveEncodedPayload`: A method to receive and emit encrypted data events from the Translator Contract
- `retryPayload`: A method to retry failed payload sending (test mode)

# Client Contract
## Purpose:
The Client Contract is responsible for receiving and processing events from other blockchains. A single contract can handle both sending and receiving logic, or two separate contracts can be utilized for these functions. If only one direction of message processing is needed, the relevant base methods can be overridden.

## Data Processing:
In the encrypted data mode, the contract first receives encrypted bytecode. After the encrypted bytecode has been processed by the client server, the decrypted data is received by the contract and processed according to its logic. In the case of working with unencrypted data, the first step is omitted and the contract immediately processes the received bytecode according to its logic.

## Key Variables:
- `initializer`: The address of the Initializer Contract
- `owner`: The address of the contract owner
- `transactionId`: Internal transaction ID
- `isEncoded`: Flag for sending encoded messages (use client server for this options)
- `forceOrdered`: A switch to toggle between serial and parallel execution
- `adminsMap`: Additional addresses list who can execute some internal functions

## Base Contract Methods:
- `asterismReceive`: This virtual method is responsible for receiving data from the Initializer Contract. It emits an event that is read by the client server.
- `asterismReceiveEncoded`: This virtual method is responsible for receiving encrypted data from the Initializer Contract. It emits an event that is read by the client server.
- `_sendMessage`: This method is responsible for sending messages to the Initializer Contract.
- `_generateSendingEvent`: This method generates the event that will be considered by the client server.
- `_sendDataToInitializer`: This method is responsible for sending unencrypted messages to the Initializer Contract, so that they can be broadcasted to another network.


## Integration

To integrate with the Asterism Protocol, you need to implement a contract that will inherit from the `BaseAsterizmClient`.

The abstract `BaseAsterizmClient` already has all the necessary methods for receiving and sending messages to the initializer contract. To receive messages, the only method you need to implement is the `asterismReceive` method. This method accepts the following parameters:

- `_srcChainId`: The ID of the chain from which the message was sent
- `_srcAddress`: The sender's address from the source chain
- `_nonce`: The transaction sequence number
- `_transactionId`: The transaction ID
- `_payload`: The bytecode that contains the parameters passed when the method was called in the source chain

You can process all or some of these parameters according to your needs.

To send plaintext messages to the initializer contract, you need to call the `_sendDataToInitializer` method and pass the following parameters:

- `destChain`: The destination chain ID
- `destAddress`: The address in the destination chain
- `_feeAmount`: The native coins amount that you want to send for coverage translator transactions fees
- `payload`: The bytecode that contains the parameters to be passed to the contract in the destination chain

To allow the client server to read and encrypt data from your contract, you need to call the `_generateSendingEvent` method and pass the following parameters:

- `dstChainId`: The destination chain ID
- `destination`: The address in the destination chain
- `payload`: The bytecode that contains the parameters to be passed to the contract in the destination chain

After the client server encrypts the transaction payload, the `_sendMessage` method will be called, which will pass the payload to the initializer contract.


Here is an example of sending an unencrypted message:

```solidity
function sendMessage(uint16 destChain, address destAddress, uint amount, address receiver, address tokenAddress) {
    bytes memory payload = abi.encode(receiver, amount, tokenAddress);
    _sendDataToInitializer(destChain, destAddress, payload);
}
```

And here is an example of sending an encrypted message:

```solidity
function proxyMessage(uint16 destChain, address destAddress, uint amount, address receiver, address tokenAddress) {
    bytes memory payload = abi.encode(receiver, amount, tokenAddress);
    _generateSendingEvent(destChain, destAddress, payload);
}
```
