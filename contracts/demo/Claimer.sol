// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IMultiChainToken} from "../interfaces/IMultiChainToken.sol";
import {AddressLib} from "../libs/AddressLib.sol";

/// Claimer demo
contract Claimer {

    using AddressLib for address;

    IMultiChainToken public multichainToken;

    constructor(IMultiChainToken token) {
        multichainToken = token;
    }

    /// Claim function
    /// @param _chainIds uint64[]  Chain IDs
    /// @param _amounts uint[]  Amounts
    function claim(uint64[] memory _chainIds, uint[] memory _amounts) public {
        for (uint i = 0; i < _chainIds.length; i++) {
            multichainToken.crossChainTransfer(_chainIds[i], address(this), msg.sender.toUint(), _amounts[i]);
        }
    }
}
