// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library BytesLib {

    /// Convert bytes to address format (!!!taking first 20 bytes!!!)
    /// @param _bytes bytes
    /// @return a address
    function toAddress(bytes memory _bytes) internal pure returns(address a) {
        require(_bytes.length >= 20);
        assembly {
            a := shr(96, mload(add(_bytes, 32)))
        }
    }
}
