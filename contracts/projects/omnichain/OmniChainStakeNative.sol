// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IMultiChainToken} from "../../interfaces/IMultiChainToken.sol";
import {AsterizmClient, IInitializerSender, UintLib, AsterizmErrors} from "../../base/AsterizmClient.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract OmniChainStakeNative is IMultiChainToken, ERC20, AsterizmClient {

    using UintLib for uint;

    constructor(IInitializerSender _initializerLib, uint _initialSupply)
    Ownable(_msgSender())
    ERC20("AsterizmOmniChainStakeNative", "AOCSN")
    AsterizmClient(_initializerLib, true, false)
    {
        _mint(_msgSender(), _initialSupply);
        refundLogicIsAvailable = true;
        coinWithdrawalIsDisable = true;
    }

    /// Token decimals
    /// @dev change it for your token logic
    /// @return uint8
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    /// Cross-chain transfer
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _from address  From address
    /// @param _to uint  To address in uint format
    function crossChainTransfer(uint64 _dstChainId, address _from, uint _to, uint _amount) public payable {
        uint amount = msg.value;
        require(amount > 0, CustomError(AsterizmErrors.OMNICHAIN__AMOUNT_TOO_SMALL__ERROR));
        require(amount >= _amount, CustomError(AsterizmErrors.OMNICHAIN__WRONG_AMOUNT__ERROR));
        bytes32 transferHash = _initAsterizmTransferEvent(_dstChainId, abi.encode(_to, amount, _getTxId()));
        _addRefundTransfer(transferHash, _from, amount, address(0));
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (uint dstAddressUint, uint amount, ) = abi.decode(_dto.payload, (uint, uint, uint));
        require(address(this).balance >= amount, CustomError(AsterizmErrors.OMNICHAIN__BALANCE_NOT_ENOUGH__ERROR));
        (bool success, ) = dstAddressUint.toAddress().call{value: amount}("");
        require(success, CustomError(AsterizmErrors.OMNICHAIN__TRANSFER_ERROR__ERROR));
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (uint dstAddressUint, uint amount, uint txId) = abi.decode(_payload, (uint, uint, uint));
        return abi.encodePacked(dstAddressUint, amount, txId);
    }
}
