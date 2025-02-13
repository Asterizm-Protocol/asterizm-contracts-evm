// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {IMultiChainToken} from "../../interfaces/IMultiChainToken.sol";
import {AsterizmClientUpgradeable, IInitializerSender, SafeERC20, IERC20, UintLib} from "../../base/AsterizmClientUpgradeable.sol";
import {FeeLogic} from "./FeeLogic.sol";
import {VenidiumErrors} from "./VenidiumErrors.sol";

contract NativeDstMultichainUpgradeableV1 is IMultiChainToken, ERC20Upgradeable, FeeLogic, AsterizmClientUpgradeable {

    using SafeERC20 for IERC20;
    using UintLib for uint;

    uint8 public customDecimals;

    /// Initializing function for upgradeable contracts (constructor)
    /// @param _initializerLib IInitializerSender  Initializer library address
    /// @param _initialSupply uint  Initial supply
    /// @param _decimals uint8  Decimals
    /// @param _feeBaseAddress address  Base fee address
    function initialize(IInitializerSender _initializerLib, uint _initialSupply, uint8 _decimals, address _feeBaseAddress) initializer public {
        __AsterizmClientUpgradeable_init(_initializerLib, true, false);
        __ERC20_init("UnknownTokenND", "UTND");
        _mint(_msgSender(), _initialSupply);
        customDecimals = _decimals;
        feeBaseAddress = _feeBaseAddress;
        coinWithdrawalIsDisable = true;
        refundLogicIsAvailable = true;
    }

    /// Token decimals
    /// @dev change it for your token logic
    /// @return uint8
    function decimals() public view virtual override returns (uint8) {
        return customDecimals;
    }

    /// Cross-chain transfer
    /// @param _dstChainId uint64  Destination chain ID
    /// @param _from address  From address
    /// @param _to uint  To address in uint format
    function crossChainTransfer(uint64 _dstChainId, address _from, uint _to, uint _amount) public payable {
        require(_amount > 0, CustomError(VenidiumErrors.VENIDIUM__AMOUNT_TOO_SMALL__ERROR));
        require(msg.value >= _amount, CustomError(VenidiumErrors.VENIDIUM__AMOUNT_TOO_BIG__ERROR));
        uint amount = execFeeLogic(address(0), _amount, true);
        bytes32 transferHash = _initAsterizmTransferEvent(_dstChainId, abi.encode(_to, amount, _getTxId()));
        _addRefundTransfer(transferHash, _from, amount, address(0));
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (uint dstAddressUint, uint amount, ) = abi.decode(_dto.payload, (uint, uint, uint));
        require(address(this).balance >= amount, CustomError(VenidiumErrors.VENIDIUM__BALANCE_NOT_ENOUGH__ERROR));
        (bool success, ) = dstAddressUint.toAddress().call{value: amount}("");
        require(success, CustomError(VenidiumErrors.VENIDIUM__TRANSFER_ERROR__ERROR));
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (uint dstAddressUint, uint amount, uint txId) = abi.decode(_payload, (uint, uint, uint));

        return abi.encodePacked(dstAddressUint, amount, txId);
    }
}
