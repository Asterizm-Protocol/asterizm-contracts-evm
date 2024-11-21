// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {IRouter} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouter.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";

contract ChainlinkTestRouter is Ownable, IRouter, IRouterClient {

    event CcipSendEvent(bytes32 _messageId, uint _messageFee);
    event AddTokenAddressEvent(address _tokenAddress);
    event SetFeeTokenEvent(address _feeTokenAddress);
    event SetBaseFeeEvent(uint _baseFeeAmount);

    using SafeERC20 for IERC20;
    address[] private tokens;
    uint private baseFee;
    IERC20 private feeToken;

    constructor (IERC20 _feeToken, uint _baseFee) {
        setFeeToken(_feeToken);
        addToken(address(_feeToken));
        setBaseFee(_baseFee);
    }

    /// Add token
    /// @param _tokenAddress address  Token address
    function addToken(address _tokenAddress) public {
        tokens.push(_tokenAddress);
        emit AddTokenAddressEvent(_tokenAddress);
    }

    /// Set fee token
    /// @param _feeToken IERC20  Fee token
    function setFeeToken(IERC20 _feeToken) public {
        feeToken = _feeToken;
        emit SetFeeTokenEvent(address(_feeToken));
    }

    /// Set base fee
    /// @param _baseFee uint  Base fee amount
    function setBaseFee(uint _baseFee) public {
        baseFee = _baseFee;
        emit SetBaseFeeEvent(_baseFee);
    }

    /// @notice Checks if the given chain ID is supported for sending/receiving.
    /// @param chainSelector The chain to check.
    /// @return supported is true if it is supported, false if not.
    function isChainSupported(uint64 chainSelector) external view returns (bool) {
        return true;
    }

    /// @notice Gets a list of all supported tokens which can be sent or received
    /// to/from a given chain id.
    /// @param chainSelector The chainSelector.
    /// @return tokens The addresses of all tokens that are supported.
    function getSupportedTokens(uint64 chainSelector) external view returns (address[] memory) {
        return tokens;
    }

    /// @param _dstChainSelector uint64  The destination chainSelector
    /// @param _message Client.EVM2AnyMessage  The cross-chain CCIP message including data and/or tokens
    /// @return uint  Returns guaranteed execution fee for the specified message delivery to destination chain
    /// @dev returns 0 fee on invalid message.
    function getFeePrivate(uint64 _dstChainSelector, Client.EVM2AnyMessage memory _message) private view returns(uint256) {
        return baseFee;
    }

    /// @param _dstChainSelector uint64  The destination chainSelector
    /// @param _message Client.EVM2AnyMessage  The cross-chain CCIP message including data and/or tokens
    /// @return uint  Returns guaranteed execution fee for the specified message delivery to destination chain
    /// @dev returns 0 fee on invalid message.
    function getFee(uint64 _dstChainSelector, Client.EVM2AnyMessage memory _message) external view returns (uint256) {
        return getFeePrivate(_dstChainSelector, _message);
    }

    /// @notice Request a message to be sent to the destination chain
    /// @param _dstChainSelector uint64  The destination chain ID
    /// @param _message Client.EVM2AnyMessage  The cross-chain CCIP message including data and/or tokens
    /// @return bytes32  The message ID
    /// @dev Note if msg.value is larger than the required fee (from getFee) we accept the overpayment with no refund.
    function ccipSend(uint64 _dstChainSelector, Client.EVM2AnyMessage calldata _message) external payable returns (bytes32) {
        uint messageFee = getFeePrivate(_dstChainSelector, _message);
        require(feeToken.allowance(msg.sender, address(this)) >= messageFee, "ChainlinkRouter: fee token allowance is not enough");
        feeToken.transferFrom(msg.sender, address(this), messageFee);

        bytes32 messageId = sha256(abi.encode(_message));
        emit CcipSendEvent(messageId, messageFee);

        return messageId;
    }

    /// @inheritdoc IRouter
    /// @dev Handles the edge case where we want to pass a specific amount of gas,
    /// @dev but EIP-150 sends all but 1/64 of the remaining gas instead so the user gets
    /// @dev less gas than they paid for. The other 2 parts of EIP-150 do not apply since
    /// @dev a) we hard code value=0 and b) we ensure code already exists.
    /// @dev If we revert instead, then that will never happen.
    /// @dev Separately we capture the return data up to a maximum size to avoid return bombs,
    /// @dev borrowed from https://github.com/nomad-xyz/ExcessivelySafeCall/blob/main/src/ExcessivelySafeCall.sol.
    function routeMessage(
        Client.Any2EVMMessage calldata message,
        uint16 gasForCallExactCheck,
        uint256 gasLimit,
        address receiver
    ) external override returns(bool success, bytes memory retData) {
        CCIPReceiver(receiver).ccipReceive(message);
        return (true, abi.encode(receiver));
    }
}
