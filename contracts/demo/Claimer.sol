// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IMultiChainToken.sol";

/// Claimer demo
contract Claimer {

    IMultiChainToken public multichainToken;

    constructor(IMultiChainToken token) {
        multichainToken = token;
    }

    /// Claim function
    /// @param _chainIds uint64[]  Chain IDs
    /// @param _amounts uint[]  Amounts
    /// @param _tokenAddresses address[]  Token addresses
    function claim(uint64[] memory _chainIds, uint[] memory _amounts, address[] memory _tokenAddresses) public {
        for (uint i = 0; i < _chainIds.length; i++) {
            multichainToken.crossChainTransfer(_chainIds[i], address(this), msg.sender, _amounts[i], _tokenAddresses[i]);
        }
    }
}
