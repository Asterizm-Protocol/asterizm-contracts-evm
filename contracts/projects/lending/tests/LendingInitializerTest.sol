// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AsterizmClient, IInitializerSender, UintLib} from "../../../base/AsterizmClient.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BytesLib} from "../../../libs/BytesLib.sol";
import {AddressLib} from "../../../libs/AddressLib.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LendingInitializerTest is AsterizmClient {

    using UintLib for uint;
    using BytesLib for bytes;
    using AddressLib for address;

    struct Stake {
        bool exists;
        bool isClose;
        address initAddress;
        address targetAddress;
        uint amount;
        uint rate;
    }

    mapping(uint => Stake) public stakes;

    /// Constructor
    /// @param _initializerLib IInitializerSender  Initializer library address
    constructor(IInitializerSender _initializerLib)
    Ownable(_msgSender())
    AsterizmClient(_initializerLib, true, false)
    {}

    /// Init position
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _amount uint  Staking amount
    /// @param _rate uint  Staking rate
    /// @param _to address  Target address
    function initPosition(uint64 _dstChainId, uint _amount, uint _rate, address _to) public payable {
        uint stakeId = _getTxId();
        stakes[stakeId].exists = true;
        stakes[stakeId].initAddress = _msgSender();
        stakes[stakeId].targetAddress = _to;
        stakes[stakeId].amount = _amount;
        stakes[stakeId].rate = _rate;
        _initAsterizmTransferEvent(_dstChainId, abi.encode(stakeId, _amount, _rate, _to.toBytes()));
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (uint stakeId, , , ) = abi.decode(_dto.payload, (uint, uint, uint, bytes));
        stakes[stakeId].isClose = true;
        stakes[stakeId].initAddress.call{value: stakes[stakeId].amount}("");
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (uint stakeId, uint stakeAmount, uint rate, bytes memory dstAddressBytes) = abi.decode(_payload, (uint, uint, uint, bytes));
        return abi.encodePacked(stakeId, stakeAmount, rate, dstAddressBytes);
    }
}
