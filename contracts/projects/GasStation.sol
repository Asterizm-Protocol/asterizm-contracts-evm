// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../base/AsterizmClient.sol";
import "../libs/UintLib.sol";

contract GasStation is AsterizmClient {

    using SafeMath for uint;
    using SafeERC20 for IERC20;
    using UintLib for uint;

    event CoinsReceivedEvent(uint _amount, uint _transactionId, address dstAddress);
    event GasSendEvent(uint64 _dstChainId, uint _transactionId, bytes _payload);
    event AddStableCoinEvent(address _address);
    event RemoveStableCoinEvent(address _address);
    event SetMinUsdAmountEvent(uint _amount);
    event SetMaxUsdAmountEvent(uint _amount);
    event WithdrawCoinsEvent(address _target, uint _amount);
    event WithdrawTokensEvent(address _token, address _target, uint _amount);
    event WithdrawNotExistsTokensEvent(address _token, address _target, uint _amount);

    struct StableCoin {
        uint balance;
        bool exists;
    }

    mapping(address => StableCoin) public stableCoins;
    uint public minUsdAmount;
    uint public maxUsdAmount;

    constructor(IInitializerSender _initializerLib, bool _useForceOrder)
        AsterizmClient(_initializerLib, _useForceOrder, true) {}

    receive() external payable {}
    fallback() external payable {}
    function addCoins() external payable {}

    /// Withdraw coins
    /// @param _target address  Target address
    /// @param _amount uint  Amount
    function withdrawCoins(address _target, uint _amount) external onlyOwner {
        require(address(this).balance >= _amount, "GasStation: coins balance not enough");
        (bool success, ) = _target.call{value: _amount}("");
        require(success, "GasStation: transfer error");
        emit WithdrawCoinsEvent(_target, _amount);
    }

    /// Withdraw exists tokens
    /// @param _token IERC20  Token
    /// @param _target address  Target address
    /// @param _amount uint  Amount
    function withdrawTokens(IERC20 _token, address _target, uint _amount) external onlyOwner {
        address tokenAddress = address(_token);
        require(stableCoins[tokenAddress].exists, "GasStation: token not exists");
        require(stableCoins[tokenAddress].balance >= _amount, "GasStation: tokens balance not enough");
        _token.safeTransfer(_target, _amount);
        stableCoins[tokenAddress].balance = stableCoins[tokenAddress].balance.sub(_amount);
        emit WithdrawTokensEvent(address(_token), _target, _amount);
    }

    /// Withdraw non-exists tokens
    /// @param _token IERC20  Token
    /// @param _target address  Target address
    /// @param _amount uint  Amount
    function withdrawNotExistsTokens(IERC20 _token, address _target, uint _amount) external onlyOwner {
        require(_token.balanceOf(address(this)) >= _amount, "GasStation: tokens balance not enough");
        _token.safeTransfer(_target, _amount);
        address tokenAddress = address(_token);
        if (stableCoins[tokenAddress].exists) {
            stableCoins[tokenAddress].balance = stableCoins[tokenAddress].balance.sub(_amount);
        }
        emit WithdrawNotExistsTokensEvent(address(_token), _target, _amount);
    }

    /// Add stable coin
    /// @param _tokenAddress address  Token address
    function addStableCoin(address _tokenAddress) external onlyOwner {
        stableCoins[_tokenAddress].exists = true;
        emit AddStableCoinEvent(_tokenAddress);
    }

    /// Remove stable coin
    /// @param _tokenAddress address  Token address
    function removeStableCoin(address _tokenAddress) external onlyOwner {
        delete stableCoins[_tokenAddress];
        emit RemoveStableCoinEvent(_tokenAddress);
    }

    /// Set minimum amount in USD
    /// @param _amount uint  Amount
    function setMinUsdAmount(uint _amount) external onlyOwner {
        minUsdAmount = _amount;
        emit SetMinUsdAmountEvent(_amount);
    }

    /// Set maximum amount in USD
    /// @param _amount uint  Amount
    function setMaxUsdAmount(uint _amount) external onlyOwner {
        maxUsdAmount = _amount;
        emit SetMaxUsdAmountEvent(_amount);
    }

    /// Send gas logic
    /// @param _chainIds uint64[]  Chains IDs
    /// @param _amounts uint[]  Amounts
    /// @param _receivers uint[]  Receivers
    /// @param _token IERC20  Token
    function sendGas(uint64[] memory _chainIds, uint[] memory _amounts, uint[] memory _receivers, IERC20 _token) external nonReentrant {
        require(stableCoins[address(_token)].exists, "GasStation: wrong token");
        (bool success, bytes memory result) = address(_token).call(abi.encodeWithSignature("decimals()"));
        require(success, "GasStation: decimals request failed");
        uint8 decimals = abi.decode(result, (uint8));
        uint sum = 0;
        for (uint i = 0; i < _amounts.length; i++) {
            sum = sum.add(_amounts[i]);
        }

        require(sum > 0, "GasStation: wrong amounts");
        uint sumInUsd = sum.div(10 ** decimals);
        require(sumInUsd > 0, "GasStation: wrong amounts in USD");
        if (minUsdAmount > 0) {
            require(sumInUsd >= minUsdAmount, "GasStation: minimum amount validation error");
        }
        if (maxUsdAmount > 0) {
            require(sumInUsd <= maxUsdAmount, "GasStation: maximum amount validation error");
        }

        _token.safeTransferFrom(msg.sender, address(this), sum);
        stableCoins[address(_token)].balance = stableCoins[address(_token)].balance.add(sum);
        for (uint i = 0; i < _amounts.length; i++) {
            uint txId = _getTxId();
            ClInitTransferEventDto memory dto = _buildClInitTransferEventDto(_chainIds[i], abi.encode(_receivers[i], _amounts[i], txId, address(_token), decimals));
            _initAsterizmTransferEvent(dto);
            emit GasSendEvent(_chainIds[i], txId, dto.payload);
        }
    }

    /// Receive non-encoded payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (uint dstAddressUint, uint amount, uint txId , address tokenAddress, uint decimals, uint stableRate) = abi.decode(_dto.payload, (uint, uint, uint, address, uint, uint));
        require(
            _validTransferHash(_dto.srcChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress, _dto.txId, abi.encode(dstAddressUint, amount, txId, tokenAddress, decimals), _dto.transferHash),
            "GasStation: transfer hash is invalid"
        );

        address dstAddress = dstAddressUint.toAddress();
        uint amountToSend = amount.mul(stableRate).div(10 ** decimals);
        if (dstAddress != address(this)) {
            (bool success, ) = dstAddress.call{value: amountToSend}("");
            require(success, "GasStation: transfer error");
        }

        emit CoinsReceivedEvent(amountToSend, _dto.txId, dstAddress);
    }
}
