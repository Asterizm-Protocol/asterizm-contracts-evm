// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {IMultiChainToken} from "../../interfaces/IMultiChainToken.sol";
import {AsterizmClientUpgradeable, IInitializerSender, UintLib, AsterizmErrors} from "../../base/AsterizmClientUpgradeable.sol";

contract OmniChainTokenUpgradeableV1 is IMultiChainToken, ERC20Upgradeable, AsterizmClientUpgradeable {

    using UintLib for uint;

    /// Initializing function for upgradeable contracts (constructor)
    /// @param _initializerLib IInitializerSender  Initializer library address
    function initialize(IInitializerSender _initializerLib, uint _initialSupply) initializer public {
        __AsterizmClientUpgradeable_init(_initializerLib, true, false);
        __ERC20_init("AsterizmOmniChainToken", "AOCT");
        _mint(_msgSender(), _initialSupply);
        refundLogicIsAvailable = true;
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
        uint amount = _debitFrom(_from, _amount); // amount returned should not have dust
        require(amount > 0, CustomError(AsterizmErrors.OMNICHAIN__AMOUNT_TOO_SMALL__ERROR));
        bytes32 transferHash = _initAsterizmTransferEvent(_dstChainId, abi.encode(_to, amount, _getTxId()));
        _addRefundTransfer(transferHash, _from, amount, address(this));
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (uint dstAddressUint, uint amount, ) = abi.decode(_dto.payload, (uint, uint, uint));
        _mint(dstAddressUint.toAddress(), amount);
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (uint dstAddressUint, uint amount, uint txId) = abi.decode(_payload, (uint, uint, uint));
        return abi.encodePacked(dstAddressUint, amount, txId);
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
