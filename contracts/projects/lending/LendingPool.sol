// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ILendingPool} from "./interfaces/ILendingPool.sol";
import {LendingErrors} from "./base/LendingErrors.sol";
import {AsterizmWithdrawal, Ownable} from "../../base/AsterizmWithdrawal.sol";

contract LendingPool is ILendingPool, AsterizmWithdrawal {

    error CustomError(uint16 _errorCode);

    /// Sent liquidity event
    /// @param _stakeId uint  Stake ID
    /// @param _targetAddress address  Target address
    /// @param _amount uint  Amount
    event SendLiquidityEvent(uint _stakeId, address _targetAddress, uint _amount);

    /// Close position event
    /// @param _stakeId uint  Stake ID
    /// @param _amount uint  Amount
    event ClosePositionEvent(uint _stakeId, uint _amount);

    struct Stake {
        bool exists;
        address targetAddress;
        uint amount;
        bool isClosed;
    }

    address public manipulator;
    IERC20 public liquidToken;
    mapping(uint => Stake) public stakes;

    constructor(address _manipulator, IERC20 _liquidToken) Ownable(_msgSender()) {
        manipulator = _manipulator;
        liquidToken = _liquidToken;
    }

    /// Only manipulator modifier
    modifier onlyManipulator() {
        require(manipulator == _msgSender(), CustomError(LendingErrors.LENDING__ONLY_MODIFIER__ERROR));
        _;
    }

    /// Return liquid token
    /// @return IERC20
    function getLiquidToken() external returns(IERC20) {
        return liquidToken;
    }

    /// Send liquidity
    /// @param _stakeId uint  Staking ID
    /// @param _targetAddress address  Target address
    /// @param _amount uint  Amount
    function sendLiquidity(uint _stakeId, address _targetAddress, uint _amount) external onlyManipulator {
        require(!stakes[_stakeId].exists, CustomError(LendingErrors.LENDING__STAKE_EXISTS_ALREADY__ERROR));
        require(_amount > 0, CustomError(LendingErrors.LENDING__AMOUNT_TOO_SMALL__ERROR));
        require(liquidToken.balanceOf(address(this)) >= _amount, CustomError(LendingErrors.LENDING__LIQUIDITY_IS_NOT_ENOUGH__ERROR));

        stakes[_stakeId].exists = true;
        stakes[_stakeId].targetAddress = _targetAddress;
        stakes[_stakeId].amount = _amount;

        liquidToken.transfer(_targetAddress, _amount);

        emit SendLiquidityEvent(_stakeId, _targetAddress, _amount);
    }

    /// Close position
    /// @param _stakeId uint  Staking ID
    function closePosition(uint _stakeId) external onlyManipulator {
        require(stakes[_stakeId].exists, CustomError(LendingErrors.LENDING__STAKE_IS_NOT_EXISTS__ERROR));
        require(!stakes[_stakeId].isClosed, CustomError(LendingErrors.LENDING__POSITION_IS_CLOSED_ALREADY__ERROR));

        stakes[_stakeId].isClosed = true;

        uint amount = stakes[_stakeId].amount;
        require(liquidToken.allowance(manipulator, address(this)) >= amount, CustomError(LendingErrors.LENDING__ALLOWANCE_IS_NOT_ENOUGH__ERROR));

        liquidToken.transferFrom(manipulator, address(this), amount);

        emit ClosePositionEvent(_stakeId, amount);
    }
}
