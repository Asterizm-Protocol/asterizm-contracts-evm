// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IMultiChainToken.sol";

contract Claimer {

    IMultiChainToken public multichainToken;
    address public multichainTokenAddress;

    constructor(IMultiChainToken token) {
        multichainToken = token;
        multichainTokenAddress = address(token);
    }

    function claim(uint64[] memory _chainIds, uint[] memory _amounts, address[] memory _tokenAddresses) public {
        for (uint i = 0; i < _chainIds.length; i++) {
            multichainToken.crossChainTransfer(_chainIds[i], address(this), msg.sender, _amounts[i], _tokenAddresses[i]);
        }
    }
}
