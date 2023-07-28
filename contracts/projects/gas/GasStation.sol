// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "asterizmprotocol/contracts/evm/AsterizmClient.sol";

contract GasStation is AsterizmClient {

    using SafeERC20 for IERC20;
    using UintLib for uint;
    using AddressLib for address;

    event CoinsReceivedEvent(uint _amount, uint _transactionId, address _dstAddress);
    event GasSendEvent(uint64 _dstChainId, uint _transactionId, bytes _payload);
    event AddStableCoinEvent(address _address);
    event RemoveStableCoinEvent(address _address);
    event SetMinUsdAmountEvent(uint _amount);
    event SetMaxUsdAmountEvent(uint _amount);
    event SetMinUsdAmountPerChainEvent(uint _amount);
    event SetMaxUsdAmountPerChainEvent(uint _amount);
    event WithdrawCoinsEvent(address _target, uint _amount);
    event WithdrawTokensEvent(address _token, address _target, uint _amount);
    event WithdrawNotExistsTokensEvent(address _token, address _target, uint _amount);

    struct StableCoin {
        uint balance;
        bool exists;
        uint8 decimals;
    }

    mapping(address => StableCoin) public stableCoins;
    uint public minUsdAmount;
    uint public maxUsdAmount;
    uint public minUsdAmountPerChain;
    uint public maxUsdAmountPerChain;

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
        if (stableCoins[tokenAddress].balance >= _amount) {
            stableCoins[tokenAddress].balance -= _amount;
        } else {
            stableCoins[tokenAddress].balance = 0;
        }
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
            if (stableCoins[tokenAddress].balance >= _amount) {
                stableCoins[tokenAddress].balance -= _amount;
            } else {
                stableCoins[tokenAddress].balance = 0;
            }
        }
        emit WithdrawNotExistsTokensEvent(address(_token), _target, _amount);
    }

    /// Add stable coin
    /// @param _tokenAddress address  Token address
    function addStableCoin(address _tokenAddress) external onlyOwner {
        (bool success, bytes memory result) = _tokenAddress.call(abi.encodeWithSignature("decimals()"));
        require(success, "GasStation: decimals request failed");

        stableCoins[_tokenAddress].decimals = abi.decode(result, (uint8));
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

    /// Set minimum amount in USD per chain
    /// @param _amount uint  Amount
    function setMinUsdAmountPerChain(uint _amount) external onlyOwner {
        minUsdAmountPerChain = _amount;
        emit SetMinUsdAmountPerChainEvent(_amount);
    }

    /// Set maximum amount in USD per chain
    /// @param _amount uint  Amount
    function setMaxUsdAmountPerChain(uint _amount) external onlyOwner {
        maxUsdAmountPerChain = _amount;
        emit SetMaxUsdAmountPerChainEvent(_amount);
    }

    /// Send gas logic
    /// @param _chainIds uint64[]  Chains IDs
    /// @param _amounts uint[]  Amounts
    /// @param _receivers uint[]  Receivers
    /// @param _token IERC20  Token
    function sendGas(uint64[] memory _chainIds, uint[] memory _amounts, uint[] memory _receivers, IERC20 _token) external nonReentrant {
        address tokenAddress = address(_token);
        require(stableCoins[tokenAddress].exists, "GasStation: wrong token");

        uint tokenDecimals = 10 ** stableCoins[tokenAddress].decimals;
        uint sum;
        for (uint i = 0; i < _amounts.length; i++) {
            if (minUsdAmountPerChain > 0) {
                uint amountInUsd = _amounts[i] / tokenDecimals;
                require(amountInUsd >= minUsdAmountPerChain, "GasStation: minimum amount per chain validation error");
            }
            if (maxUsdAmountPerChain > 0) {
                uint amountInUsd = _amounts[i] / tokenDecimals;
                require(amountInUsd <= maxUsdAmountPerChain, "GasStation: maximum amount per chain validation error");
            }

            sum += _amounts[i];
        }

        require(sum > 0, "GasStation: wrong amounts");
        {
            uint sumInUsd = sum / tokenDecimals;
            require(sumInUsd > 0, "GasStation: wrong amounts in USD");
            if (minUsdAmount > 0) {
                require(sumInUsd >= minUsdAmount, "GasStation: minimum amount validation error");
            }
            if (maxUsdAmount > 0) {
                require(sumInUsd <= maxUsdAmount, "GasStation: maximum amount validation error");
            }
        }

        _token.safeTransferFrom(msg.sender, address(this), sum);
        stableCoins[tokenAddress].balance += sum;
        for (uint i = 0; i < _amounts.length; i++) {
            uint txId = _getTxId();
            bytes memory payload = abi.encode(_receivers[i], _amounts[i], txId, tokenAddress.toUint(), stableCoins[tokenAddress].decimals);
            _initAsterizmTransferEvent(_chainIds[i], payload);
            emit GasSendEvent(_chainIds[i], txId, payload);
        }
    }

    /// Receive payload
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto memory _dto) internal override {
        (uint dstAddressUint, uint amount, uint txId , uint tokenAddressUint, uint8 decimals, uint stableRate) = abi.decode(_dto.payload, (uint, uint, uint, uint, uint8, uint));
        require(
            _validTransferHash(
                _dto.srcChainId, _dto.srcAddress, _dto.dstChainId, _dto.dstAddress, _dto.txId,
                abi.encode(dstAddressUint, amount, txId, tokenAddressUint, decimals),
                _dto.transferHash
            ),
            "GasStation: transfer hash is invalid"
        );

        address dstAddress = dstAddressUint.toAddress();
        uint amountToSend = amount * stableRate / (10 ** decimals);
        if (dstAddress != address(this)) {
            (bool success, ) = dstAddress.call{value: amountToSend}("");
            require(success, "GasStation: transfer error");
        }

        emit CoinsReceivedEvent(amountToSend, _dto.txId, dstAddress);
    }

    /// Build packed payload (abi.encodePacked() result)
    /// @param _payload bytes  Default payload (abi.encode() result)
    /// @return bytes  Packed payload (abi.encodePacked() result)
    function _buildPackedPayload(bytes memory _payload) internal pure override returns(bytes memory) {
        (uint dstAddressUint, uint amount, uint txId , uint tokenAddressUint, uint8 decimals) = abi.decode(_payload, (uint, uint, uint, uint, uint8));

        return abi.encodePacked(dstAddressUint, amount, txId, tokenAddressUint, decimals);
    }
}
