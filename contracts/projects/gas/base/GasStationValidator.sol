// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IGasStationValidator.sol";

contract GasStatioValidator is Ownable, IGasStationValidator {

    event AddStableCoinEvent(address _address);
    event RemoveStableCoinEvent(address _address);
    event SetMinUsdAmountEvent(uint _amount);
    event SetMaxUsdAmountEvent(uint _amount);
    event SetMinUsdAmountPerChainEvent(uint _amount);
    event SetMaxUsdAmountPerChainEvent(uint _amount);

    struct StableCoin {
        bool exists;
        uint8 decimals;
    }

    address private _gasStation;
    mapping(address => StableCoin) public stableCoins;
    uint public minUsdAmount;
    uint public maxUsdAmount;
    uint public minUsdAmountPerChain;
    uint public maxUsdAmountPerChain;

    constructor () Ownable(_msgSender()) {}

    /// Only gas station modifier
    modifier onlyGasStation {
        require(msg.sender == _gasStation, "GasStatioValidation: only gas station");
        _;
    }

    /// Add stable coin
    /// @param _tokenAddress address  Token address
    function addStableCoin(address _tokenAddress) external onlyGasStation {
        (bool success, bytes memory result) = _tokenAddress.call(abi.encodeWithSignature("decimals()"));
        require(success, "GasStation: decimals request failed");

        stableCoins[_tokenAddress].decimals = abi.decode(result, (uint8));
        stableCoins[_tokenAddress].exists = true;

        emit AddStableCoinEvent(_tokenAddress);
    }

    /// Remove stable coin
    /// @param _tokenAddress address  Token address
    function removeStableCoin(address _tokenAddress) external onlyGasStation {
        delete stableCoins[_tokenAddress];
        emit RemoveStableCoinEvent(_tokenAddress);
    }

    /// Set minimum amount in USD
    /// @param _amount uint  Amount
    function setMinUsdAmount(uint _amount) external onlyGasStation {
        minUsdAmount = _amount;
        emit SetMinUsdAmountEvent(_amount);
    }

    /// Set maximum amount in USD
    /// @param _amount uint  Amount
    function setMaxUsdAmount(uint _amount) external onlyGasStation {
        maxUsdAmount = _amount;
        emit SetMaxUsdAmountEvent(_amount);
    }

    /// Set minimum amount in USD per chain
    /// @param _amount uint  Amount
    function setMinUsdAmountPerChain(uint _amount) external onlyGasStation {
        minUsdAmountPerChain = _amount;
        emit SetMinUsdAmountPerChainEvent(_amount);
    }

    /// Set maximum amount in USD per chain
    /// @param _amount uint  Amount
    function setMaxUsdAmountPerChain(uint _amount) external onlyGasStation {
        maxUsdAmountPerChain = _amount;
        emit SetMaxUsdAmountPerChainEvent(_amount);
    }

    /// GasStations address getter
    /// @return address  GasStation address
    function gasStation() public view returns(address) {
        return _gasStation;
    }

    /// Calculate and validate sending amount
    /// @param _amounts uint[]  Amounts
    /// @param _token IERC20  Token
    function calcSendingAmount(uint[] memory _amounts, IERC20 _token) external view returns(uint, uint8) {
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

        return (sum, stableCoins[tokenAddress].decimals);
    }
}
