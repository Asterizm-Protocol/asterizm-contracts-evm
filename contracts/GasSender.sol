// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IERC20.sol";
import "./base/BaseAsterizmClient.sol";

contract GasSender is BaseAsterizmClient {

    using SafeMath for uint;
    event CoinsReceived(uint amount, uint _transactionId, address dstAddress);

    struct StableCoin {
        uint balance;
        bool exists;
    }

    mapping(address => StableCoin) public stableCoins;
    uint public minUsdAmount;
    uint public maxUsdAmount;

    constructor(IInitializerSender _initializerLib)
    BaseAsterizmClient(_initializerLib, true, false) {}

    receive() external payable {}
    fallback() external payable {}
    function addCoins() external payable {}

    function withdrawCoins(address dstAddress, uint amount) external onlyOwner {
        require(address(this).balance >= amount, "GasSender: coins balance not enough");
        (bool success, ) = dstAddress.call{value: amount}("");
        require(success, "GasSender: transfer error");
    }

    function withdrawTokens(IERC20 token, address receiver, uint amount) external onlyOwner {
        address tokenAddress = address(token);
        require(stableCoins[tokenAddress].exists, "GasSender: token not exists");
        require(stableCoins[tokenAddress].balance >= amount, "GasSender: tokens balance not enough");
        token.transfer(receiver, amount);
        stableCoins[tokenAddress].balance = stableCoins[tokenAddress].balance.sub(amount);
    }

    function withdrawNotExistsTokens(IERC20 token, address receiver, uint amount) external onlyOwner {
        require(token.balanceOf(address(this)) >= amount, "GasSender: tokens balance not enough");
        token.transfer(receiver, amount);
        address tokenAddress = address(token);
        if (stableCoins[tokenAddress].exists) {
            stableCoins[tokenAddress].balance = stableCoins[tokenAddress].balance.sub(amount);
        }
    }

    function authorizeStableCoin(address tokenAddress) external onlyOwner {
        stableCoins[tokenAddress].exists = true;
    }

    function removeStableCoin(address tokenAddress) external onlyOwner {
        delete stableCoins[tokenAddress];
    }

    function setMinUsdAmount(uint _amount) external onlyOwner {
        minUsdAmount = _amount;
    }

    function setMaxUsdAmount(uint _amount) external onlyOwner {
        maxUsdAmount = _amount;
    }

    function sendGasEnc(uint64[] memory _chainIds, uint[] memory _amounts, address[] memory _addresses, address[] memory _receivers, IERC20 _token) external {
        address tokenAddress = address(_token);
        require(stableCoins[tokenAddress].exists, "GasSender: wrong token");
        uint8 decimals = _token.decimals();
        uint length = _amounts.length;
        uint sum = 0;
        for (uint i = 0; i < length; i++) {
            sum = sum.add(_amounts[i]);
        }

        require(sum > 0, "GasSender: wrong amounts");
        uint sumInUsd = sum.div(10 ** decimals);
        require(sumInUsd > 0, "GasSender: wrong amounts in USD");
        if (minUsdAmount > 0) {
            require(sumInUsd >= minUsdAmount, "GasSender: minimum amount validation error");
        }
        if (maxUsdAmount > 0) {
            require(sumInUsd <= maxUsdAmount, "GasSender: maximum amount validation error");
        }

        require(_token.transferFrom(msg.sender, address(this), sum), "GasSender: token transfer failed");
        stableCoins[tokenAddress].balance = stableCoins[tokenAddress].balance.add(sum);
        for (uint i = 0; i < length; i++) {
            bytes memory payload = abi.encode(_receivers[i], _amounts[i], tokenAddress, decimals);
            _generateSendingEvent(_chainIds[i], _addresses[i], payload);
        }
    }

    function asterismReceive(uint64 _srcChainId, address _srcAddress, uint _nonce, uint _transactionId, bytes calldata _payload) public override onlyOwnerOrInitializer {
        (address payable dstAddress, uint amount, , uint decimals, uint stableRate) = abi.decode(_payload, (address, uint, address, uint, uint));
        uint amountToSend = amount.mul(stableRate).div(10 ** decimals);
        if (dstAddress != address(this)) {
            (bool success, ) = dstAddress.call{value: amountToSend}("");
            require(success, "GasSender: transfer error");
        }
        emit CoinsReceived(amountToSend, _transactionId, dstAddress);
    }
}
