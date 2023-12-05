// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ChainlinkTestToken is ERC20 {

    uint8 private decimalsVal;

    constructor(uint _totalSupply, uint8 _decimals) ERC20("ChainlinkTestToken", "CTT") {
        decimalsVal = _decimals;
        _mint(msg.sender, _totalSupply * 10 ** decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return decimalsVal;
    }
}
