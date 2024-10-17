// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// Asterizm withdrawal contract
abstract contract AsterizmWithdrawal is Ownable, ReentrancyGuard {

    using SafeERC20 for IERC20;

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

    receive() external payable {}
    fallback() external payable {}

    /// Withdraw coins
    /// @param _target address  Target address
    /// @param _amount uint  Amount
    function withdrawCoins(address _target, uint _amount) external onlyOwner nonReentrant {
        require(!coinWithdrawalIsDisable, "AsterizmWithdrawal: coins withdrawal is disabled");
        require(address(this).balance >= _amount, "AsterizmWithdrawal: coins balance not enough");
        (bool success, ) = _target.call{value: _amount}("");
        require(success, "AsterizmWithdrawal: transfer error");
        emit WithdrawCoinsEvent(_target, _amount);
    }

    /// Withdraw tokens
    /// @param _token IERC20  Token address
    /// @param _target address  Target address
    /// @param _amount uint  Amount
    function withdrawTokens(IERC20 _token, address _target, uint _amount) external onlyOwner nonReentrant {
        require(!tokenWithdrawalIsDisable, "AsterizmWithdrawal: tokens withdrawal is disabled");
        require(_token.balanceOf(address(this)) >= _amount, "AsterizmWithdrawal: coins balance not enough");
        _token.safeTransfer(_target, _amount);
        emit WithdrawTokensEvent(address(_token), _target, _amount);
    }
}
