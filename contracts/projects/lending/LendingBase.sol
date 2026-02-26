// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ILendingBase} from "./interfaces/ILendingBase.sol";
import {ILendingPool} from "./interfaces/ILendingPool.sol";
import {LendingErrors} from "./base/LendingErrors.sol";
import {AsterizmClient, IInitializerSender, UintLib} from "../../base/AsterizmClient.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BytesLib} from "../../libs/BytesLib.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LendingBase is ILendingBase, AsterizmClient {

    using UintLib for uint;
    using BytesLib for bytes;

    /// Position is open event
    /// @param _stakeId uint  Stake ID
    /// @param _stakeAmount uint  Stake amount
    /// @param _rate uint  Rate
    /// @param _liquidAmount uint  Liquid amount
    /// @param _targetAddress address  Target address
    event PositionIsOpenEvent(uint _stakeId, uint _stakeAmount, uint _rate, uint _liquidAmount, address _targetAddress);

    /// Set base pool event
    /// @param _basePoolAddress address  Base pool address
    event SetBasePoolEvent(address _basePoolAddress);

    /// Liquidate position event
    /// @param _stakeId uint  Staking ID
    event LiquidatePositionEvent(uint _stakeId);

    struct Stake {
        bool exists;
        bool isClosed;
        uint stakeAmount;
        uint rate;
        uint liquidAmount;
        address liquidityAddress;
        address closePositionAddress;
        uint initBlockNumber;
        uint closeBlockNumber;
    }

    uint public constant RATE_DIV = 10000000000;
    uint public constant WAD = 1e18; // format
    uint public constant ANNUAL_RATE_WAD = 1e17; // 10% = 0.1 * 1e18
    uint public constant BLOCKS_PER_YEAR = 2_592_000; // blocks in year
    uint public constant RATE_PER_BLOCK_WAD = ANNUAL_RATE_WAD / BLOCKS_PER_YEAR; // rate per block

    mapping(uint => Stake) public stakes;
    ILendingPool public basePool;
    address public liquidityFeeCollector;

    /// Constructor
    /// @param _initializerLib IInitializerSender  Initializer library address
    /// @param _liquidityFeeCollector address  Liquidity fee collector address
    constructor(IInitializerSender _initializerLib, address _liquidityFeeCollector)
    Ownable(_msgSender())
    AsterizmClient(_initializerLib, true, false)
    {
        liquidityFeeCollector = _liquidityFeeCollector;
    }

    /// Only pool set modifier
    modifier onlyPoolSet() {
        require(address(basePool) != address(0), CustomError(LendingErrors.LENDING__POOL_IS_NOT_SET__ERROR));
        _;
    }

    /// Set base pool
    /// @param _basePool ILendingPool  Base pool interface
    function setBasePool(ILendingPool _basePool) external onlyOwner {
        basePool = _basePool;

        emit SetBasePoolEvent(address(_basePool));
    }

    /// Position interest calculation
    /// @param _stakeId uint  Staking ID
    /// @return uint
    function _calcPositionInterest(uint _stakeId) internal view returns(uint) {
        require(stakes[_stakeId].exists, CustomError(LendingErrors.LENDING__STAKE_IS_NOT_EXISTS__ERROR));

        uint256 blocksElapsed = block.number - stakes[_stakeId].initBlockNumber;

        return stakes[_stakeId].liquidAmount * RATE_PER_BLOCK_WAD * blocksElapsed / WAD;
    }

    /// Return position interest
    /// @param _stakeId uint  Staking ID
    /// @return uint
    function getPositionInterest(uint _stakeId) external view returns(uint) {
        require(stakes[_stakeId].exists, CustomError(LendingErrors.LENDING__STAKE_IS_NOT_EXISTS__ERROR));
        require(!stakes[_stakeId].isClosed, CustomError(LendingErrors.LENDING__POSITION_IS_CLOSED_ALREADY__ERROR));

        return _calcPositionInterest(_stakeId);
    }

    /// Return position interest
    /// @param _stakeId uint  Staking ID
    /// @return uint
    function getPositionTotal(uint _stakeId) external view returns(uint) {
        require(stakes[_stakeId].exists, CustomError(LendingErrors.LENDING__STAKE_IS_NOT_EXISTS__ERROR));
        require(!stakes[_stakeId].isClosed, CustomError(LendingErrors.LENDING__POSITION_IS_CLOSED_ALREADY__ERROR));

        return stakes[_stakeId].liquidAmount + _calcPositionInterest(_stakeId);
    }

    /// Position liquidation
    /// @param _stakeId uint  Staking ID
    function liquidatePosition(uint _stakeId) external onlySenderOrOwner {
        require(stakes[_stakeId].exists, CustomError(LendingErrors.LENDING__STAKE_IS_NOT_EXISTS__ERROR));
        require(!stakes[_stakeId].isClosed, CustomError(LendingErrors.LENDING__POSITION_IS_CLOSED_ALREADY__ERROR));

        stakes[_stakeId].isClosed = true;
        stakes[_stakeId].closePositionAddress = _msgSender();
        stakes[_stakeId].closeBlockNumber = block.number;

        emit LiquidatePositionEvent(_stakeId);
    }

    /// Cross-chain transfer
    /// @param _stakeId uint  Stake ID
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _to bytes  Target address in bytes
    function crossChainUnstake(uint _stakeId, uint64 _dstChainId, bytes memory _to) public payable onlyPoolSet {
        require(stakes[_stakeId].exists, CustomError(LendingErrors.LENDING__STAKE_IS_NOT_EXISTS__ERROR));
        require(!stakes[_stakeId].isClosed, CustomError(LendingErrors.LENDING__POSITION_IS_CLOSED_ALREADY__ERROR));
        require(stakes[_stakeId].liquidityAddress == _msgSender(), CustomError(LendingErrors.LENDING__WRONG_CLIENT_ADDRESS__ERROR));

        uint currentBlockNum = block.number;
        uint liquidAmount = stakes[_stakeId].liquidAmount;
        uint liquidFee = _calcPositionInterest(_stakeId);
        uint totalAmount = liquidAmount + liquidFee;

        IERC20 liquidToken = basePool.getLiquidToken();
        require(liquidToken.allowance(_msgSender(), address(this)) >= totalAmount, CustomError(LendingErrors.LENDING__CLIENT_ALLOWANCE_IS_NOT_ENOUGH__ERROR));

        stakes[_stakeId].closePositionAddress = _msgSender();
        stakes[_stakeId].isClosed = true;
        stakes[_stakeId].closeBlockNumber = currentBlockNum;

        liquidToken.transferFrom(_msgSender(), address(this), totalAmount);
        liquidToken.approve(address(basePool), liquidAmount);
        if (liquidFee > 0) {
            liquidToken.transfer(liquidityFeeCollector, liquidFee);
        }

        basePool.closePosition(_stakeId);

        _initAsterizmTransferEvent(_dstChainId, abi.encode(_stakeId, stakes[_stakeId].stakeAmount, 0, _to));
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override onlyPoolSet {
        (uint stakeId, uint stakeAmount, uint rate, bytes memory dstAddressBytes) = abi.decode(_dto.payload, (uint, uint, uint, bytes));
        require(stakeAmount > 0, CustomError(LendingErrors.LENDING__AMOUNT_TOO_SMALL__ERROR));
        require(!stakes[stakeId].exists, CustomError(LendingErrors.LENDING__STAKE_EXISTS_ALREADY__ERROR));

        address targetAddress = dstAddressBytes.toAddress();
        uint liquidAmount = stakeAmount * rate / RATE_DIV;
        stakes[stakeId].exists = true;
        stakes[stakeId].stakeAmount = stakeAmount;
        stakes[stakeId].liquidAmount = liquidAmount;
        stakes[stakeId].liquidityAddress = targetAddress;
        stakes[stakeId].initBlockNumber = block.number;

        basePool.sendLiquidity(stakeId, targetAddress, liquidAmount);

        emit PositionIsOpenEvent(stakeId, stakeAmount, rate, liquidAmount, targetAddress);
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (uint stakeId, uint stakeAmount, uint rate, bytes memory dstAddressBytes) = abi.decode(_payload, (uint, uint, uint, bytes));
        return abi.encodePacked(stakeId, stakeAmount, rate, dstAddressBytes);
    }
}
