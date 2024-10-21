// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AsterizmSenderUpgradeable} from "./AsterizmSenderUpgradeable.sol";

/// Asterizm refund upgradeable contract
abstract contract AsterizmRefundUpgradeable is AsterizmSenderUpgradeable {

    using SafeERC20 for IERC20;

    /// Set refund fee event
    /// @param _fee uint  Refund fee
    event SetRefundFeeEvent(uint _fee);

    /// Add transfer hash event
    /// @param _transferHash bytes32  Transfer hash
    /// @param _userAddress address  User address
    /// @param _amount uint  Transfer amount
    /// @param _tokenAddress address  Token address (address(0) - native coin)
    event AddTransferEvent(bytes32 _transferHash, address _userAddress, uint _amount, address _tokenAddress);

    /// Add refund request event
    /// @param _transferHash bytes32  Transfer hash
    /// @param _userAddress address  User address
    /// @param _amount uint  Transfer amount
    /// @param _tokenAddress address  Token address (address(0) - native coin)
    event AddRefundRequestEvent(bytes32 _transferHash, address _userAddress, uint _amount, address _tokenAddress);

    /// Process refund request event
    /// @param _transferHash bytes32  Transfer hash
    /// @param _status bool  Request status (true - success, false - not success)
    event ProcessRefundRequestEvent(bytes32 _transferHash, bool _status);

    /// Transfer refund struct
    /// @param exists bool  Is transfer exists flag
    /// @param userAddress address  User address
    /// @param amount uint  Transfer amount
    /// @param tokenAddress address  Token address (address(0) - native coin)
    struct RefundTransfer {
        bool exists;
        address userAddress;
        uint amount;
        address tokenAddress;
    }

    /// Refund request struct
    /// @param exists bool  Is request exists flag
    /// @param successProcessed bool  Is request execution successfully
    /// @param rejectProcessed bool  Is request rejected
    struct RefundRequest {
        bool exists;
        bool successProcessed;
        bool rejectProcessed;
    }

    mapping(bytes32 => RefundTransfer) private refundTransfers;
    mapping(bytes32 => RefundRequest) private refundRequests;
    bool internal refundLogicIsAvailable;
    uint public refundFee;

    /// Set refund fee
    /// @param _fee uint  Refund fee
    function setRefundFee(uint _fee) external onlySenderOrOwner {
        refundFee = _fee;
        emit SetRefundFeeEvent(_fee);
    }

    /// Add refund transfer
    /// @param _transferHash bytes32  Transfer hash
    /// @param _userAddress address  User address
    /// @param _amount uint  Transfer amount
    /// @param _tokenAddress address  Token address (address(0) - native coin)
    function _addRefundTransfer(bytes32 _transferHash, address _userAddress, uint _amount, address _tokenAddress) internal {
        require(!refundTransfers[_transferHash].exists, "AsterizmRefund: refund transfer exists already");
        refundTransfers[_transferHash] = RefundTransfer(true, _userAddress, _amount, _tokenAddress);
        emit AddTransferEvent(_transferHash, _userAddress, _amount, _tokenAddress);
    }

    /// Add refund request
    /// @param _transferHash bytes32  Transfer hash
    function addRefundRequest(bytes32 _transferHash) external payable {
        require(refundLogicIsAvailable, "AsterizmRefund: refund logic is disabled");
        require(msg.value >= refundFee, "AsterizmRefund: small value");
        require(refundTransfers[_transferHash].exists, "AsterizmRefund: refund transfer not exists");
        require(!refundRequests[_transferHash].exists, "AsterizmRefund: refund request exists already");
        require(!refundRequests[_transferHash].successProcessed && !refundRequests[_transferHash].rejectProcessed , "AsterizmRefund: refund request processed already");
        refundRequests[_transferHash].exists = true;
        if (msg.value > 0) {
            (bool success, ) = owner().call{value: msg.value}("");
            require(success, "AsterizmRefund: coins transfer error");
        }

        emit AddRefundRequestEvent(
            _transferHash,
            refundTransfers[_transferHash].userAddress,
            refundTransfers[_transferHash].amount,
            refundTransfers[_transferHash].tokenAddress
        );
    }

    /// Process refund request
    /// @param _transferHash bytes32  Transfer hash
    /// @param _status bool  Request status (true - success, false - not success)
    function processRefundRequest(bytes32 _transferHash, bool _status) external onlySenderOrOwner {
        require(refundLogicIsAvailable, "AsterizmRefund: refund logic is disabled");
        require(refundTransfers[_transferHash].exists, "AsterizmRefund: refund transfer not exists");
        require(refundRequests[_transferHash].exists, "AsterizmRefund: refund request not exists");
        require(!refundRequests[_transferHash].successProcessed && !refundRequests[_transferHash].rejectProcessed , "AsterizmRefund: refund request processed already");
        if (_status) {
            refundRequests[_transferHash].successProcessed = true;
            refundTransfers[_transferHash].tokenAddress == address(0) ?
            _refundCoins(refundTransfers[_transferHash].userAddress, refundTransfers[_transferHash].amount) :
            _refundTokens(refundTransfers[_transferHash].userAddress, refundTransfers[_transferHash].amount, refundTransfers[_transferHash].tokenAddress);
        } else {
            refundRequests[_transferHash].rejectProcessed = true;
        }

        emit ProcessRefundRequestEvent(_transferHash, _status);
    }

    /// Refund coins
    /// @param _targetAddress address  Target address
    /// @param _amount uint  Coins amount
    function _refundCoins(address _targetAddress, uint _amount) internal virtual onlySenderOrOwner {
        require(refundLogicIsAvailable, "AsterizmRefund: refund logic is disabled");
        require(address(this).balance >= _amount, "AsterizmRefund: coins balance not enough");
        (bool success, ) = _targetAddress.call{value: _amount}("");
        require(success, "AsterizmRefund: coins transfer error");
    }

    /// Refund tokens
    /// @param _targetAddress address  Target address
    /// @param _amount uint  Coins amount
    /// @param _tokenAddress address  Token address
    function _refundTokens(address _targetAddress, uint _amount, address _tokenAddress) internal virtual onlySenderOrOwner {
        require(refundLogicIsAvailable, "AsterizmRefund: refund logic is disabled");
        IERC20 token = IERC20(_tokenAddress);
        require(token.balanceOf(address(this)) >= _amount, "AsterizmRefund: tokens balance not enough");
        token.safeTransfer(_targetAddress, _amount);
    }
}
