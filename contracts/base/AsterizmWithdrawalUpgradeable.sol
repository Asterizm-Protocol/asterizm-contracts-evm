// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AsterizmErrors} from "./AsterizmErrors.sol";

/// Asterizm withdrawal contract
abstract contract AsterizmWithdrawalUpgradeable is OwnableUpgradeable, ReentrancyGuardUpgradeable {

    using SafeERC20 for IERC20;

    error CustomErrorWithdraw(uint16 _errorCode);

    /// Withdrawal coins event
    /// @param _targetAddress address  Target address
    /// @param _amount uint  Amount
    event WithdrawCoinsEvent(address _targetAddress, uint _amount);

    /// Withdrawal tokens event
    /// @param _tokenAddress address  Token address
    /// @param _targetAddress address  Target address
    /// @param _amount uint  Amount
    event WithdrawTokensEvent(address _tokenAddress, address _targetAddress, uint _amount);

    bool public coinWithdrawalIsDisable;
    bool public tokenWithdrawalIsDisable;
    uint[50] private __gap;

    receive() external payable {}
    fallback() external payable {}

    /// Withdraw coins
    /// @param _target address  Target address
    /// @param _amount uint  Amount
    function withdrawCoins(address _target, uint _amount) external onlyOwner nonReentrant {
        require(!coinWithdrawalIsDisable, CustomErrorWithdraw(AsterizmErrors.WITHDRAWAL__COIN_WITHDRAWAL_DISABLE__ERROR));
        require(address(this).balance >= _amount, CustomErrorWithdraw(AsterizmErrors.WITHDRAWAL__BALANCE_NOT_ENOUGH__ERROR));
        (bool success, ) = _target.call{value: _amount}("");
        require(success, CustomErrorWithdraw(AsterizmErrors.WITHDRAWAL__TRANSFER_ERROR__ERROR));
        emit WithdrawCoinsEvent(_target, _amount);
    }

    /// Withdraw tokens
    /// @param _token IERC20  Token address
    /// @param _target address  Target address
    /// @param _amount uint  Amount
    function withdrawTokens(IERC20 _token, address _target, uint _amount) external onlyOwner nonReentrant {
        require(!tokenWithdrawalIsDisable, CustomErrorWithdraw(AsterizmErrors.WITHDRAWAL__TOKEN_WITHDRAWAL_DISABLE__ERROR));
        require(_token.balanceOf(address(this)) >= _amount, CustomErrorWithdraw(AsterizmErrors.WITHDRAWAL__BALANCE_NOT_ENOUGH__ERROR));
        _token.safeTransfer(_target, _amount);
        emit WithdrawTokensEvent(address(_token), _target, _amount);
    }
}
