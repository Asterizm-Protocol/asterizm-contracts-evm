// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IStakingToken} from "../../interfaces/IStakingToken.sol";
import {AsterizmClient, IInitializerSender, UintLib, AsterizmErrors} from "../../base/AsterizmClient.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BytesLib} from "../../libs/BytesLib.sol";

contract StakingToken is IStakingToken, ERC20, AsterizmClient {

    using UintLib for uint;
    using BytesLib for bytes;

    struct Stake {
        bool exists;
        uint amount;
    }

    mapping(uint => Stake) public stakes;

    constructor(IInitializerSender _initializerLib, uint _initialSupply)
    Ownable(_msgSender())
    ERC20("AsterizmTestStakingToken", "ASTST")
    AsterizmClient(_initializerLib, true, false)
    {
        _mint(_msgSender(), _initialSupply);
        refundLogicIsAvailable = true;
    }

    /// Token decimals
    /// @dev change it for your token logic
    /// @return uint8
    function decimals() public view virtual override returns (uint8) {
        return 10;
    }

    /// Cross-chain transfer
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _from address  From address
    /// @param _to bytes  To address in uint format
    /// @param _stakeId uint  Stake ID
    function crossChainUnstake(uint64 _dstChainId, address _from, bytes memory _to, uint _stakeId) public payable {
        require(stakes[_stakeId].exists, CustomError(AsterizmErrors.STAKING__STAKE_IS_NOT_EXISTS__ERROR));
        uint amount = _debitFrom(_from, stakes[_stakeId].amount);
        require(amount > 0, CustomError(AsterizmErrors.STAKING__AMOUNT_TOO_SMALL__ERROR));
        bytes32 transferHash = _initAsterizmTransferEvent(_dstChainId, abi.encode(_stakeId, amount, _to));
        _addRefundTransfer(transferHash, _from, amount, address(this));
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (uint stakeId, uint amount, bytes memory dstAddressBytes) = abi.decode(_dto.payload, (uint, uint, bytes));
        require(amount > 0, CustomError(AsterizmErrors.STAKING__AMOUNT_TOO_SMALL__ERROR));
        require(!stakes[stakeId].exists, CustomError(AsterizmErrors.STAKING__STAKE_EXISTS_ALREADY__ERROR));
        stakes[stakeId].exists = true;
        stakes[stakeId].amount = amount;
        _mint(dstAddressBytes.toAddress(), amount);
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (uint stakeId, uint amount, bytes memory dstAddressBytes) = abi.decode(_payload, (uint, uint, bytes));
        return abi.encodePacked(stakeId, amount, dstAddressBytes);
    }

    /// Debit logic
    /// @param _from address  From address
    /// @param _amount uint  Amount
    function _debitFrom(address _from, uint _amount) internal virtual returns(uint) {
        address spender = _msgSender();
        if (_from != spender) {
            _spendAllowance(_from, spender, _amount);
        }

        _burn(_from, _amount);

        return _amount;
    }

    /// Refund tokens
    /// @param _targetAddress address  Target address
    /// @param _amount uint  Coins amount
    /// @param _tokenAddress address  Token address
    function _refundTokens(address _targetAddress, uint _amount, address _tokenAddress) internal override onlySenderOrOwner {
        _mint(_targetAddress, _amount);
    }
}
