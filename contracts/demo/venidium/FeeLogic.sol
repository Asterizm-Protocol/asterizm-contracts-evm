// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract FeeLogic is OwnableUpgradeable {

    using SafeERC20 for IERC20;

    /// Update fee params event
    /// @param _feeBase uint  Base fee amount
    /// @param _feeMul uint  Multiply fee amount
    event UpdateFeeParamsEvent(uint _feeBase, uint _feeMul);

    address internal feeBaseAddress;
    uint public feeBase;
    uint public feeMul; // example: feeBase + feeMul = 1002 or 100.2%

    /// Return fee base address
    /// @return address  Fee base address
    function getFeeBaseAddress() external view returns(address) {
        return feeBaseAddress;
    }

    /// Set system fee (only for owner)
    /// @param _feeBase uint  Base fee
    /// @param _feeMul uint  Multiply fee
    function setFeeParams(uint _feeBase, uint _feeMul) public onlyOwner {
        feeBase = _feeBase;
        feeMul = _feeMul;
        emit UpdateFeeParamsEvent(_feeBase, _feeMul);
    }

    /// Execution fee logic
    /// _token address  Amount token address (0 - native)
    /// _amount uint  Transfer amount (100%)
    /// _needTransferFees bool  Needs to transfer fees flag
    function execFeeLogic(address _tokenAddress, uint _amount, bool _needTransferFees) internal returns(uint) {
        uint fee = calcPercent(_amount);
        if (fee == 0) {
            return _amount;
        }

        if (_needTransferFees) {
            transferFees(_tokenAddress, fee);
        }

        return _amount - fee;
    }

    /// Transfer fees
    /// _token address  Amount token address (0 - native)
    /// _fee uint  Transfer fee for all providers
    function transferFees(address _tokenAddress, uint _fee) private {
        if (_fee == 0) {
            return;
        }

        if (_tokenAddress == address(0)) {
            (bool successFirst, ) = feeBaseAddress.call{value: _fee}("");
            require(successFirst, "FeeLogic: first transfer error");
        } else {
            IERC20 token = IERC20(_tokenAddress);
            token.safeTransfer(feeBaseAddress, _fee);
        }
    }

    /// Calculate percent from amount
    /// param _amount uint  Amount (100%)
    /// @return uint  Amount percent
    function calcPercent(uint _amount) internal view returns(uint) {
        return calcPercentWithParams(_amount, feeBase, feeMul);
    }

    /// Calculate percent from amount with params
    /// param _amount uint  Amount (100%)
    /// @param _feeBase uint  Base fee
    /// @param _feeMul uint  Multiply fee
    /// @return uint  Amount percent
    function calcPercentWithParams(uint _amount, uint _feeBase, uint _feeMul) internal pure returns(uint) {
        if (_feeBase == 0) {
            return 0;
        }

        return _amount * _feeMul / _feeBase;
    }
}
