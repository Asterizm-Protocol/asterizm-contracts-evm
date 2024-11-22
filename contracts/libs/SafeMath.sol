// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library SafeMath {

    /// Add uints
    /// @param _a uint
    /// @param _b uint
    /// @return uint
    function add(uint _a, uint _b) internal pure returns(uint) {
    unchecked {
        uint c = _a + _b;
        if (c < _a) return 0;
        return c;
    }
    }

    /// Sub uints
    /// @param _a uint
    /// @param _b uint
    /// @return uint
    function sub(uint _a, uint _b) internal pure returns(uint) {
    unchecked {
        if (_b > _a) return 0;
        return _a - _b;
    }
    }

    /// Mul uints
    /// @param _a uint
    /// @param _b uint
    /// @return uint
    function mul(uint _a, uint _b) internal pure returns(uint) {
    unchecked {
        if (_a == 0) return 0;
        uint c = _a * _b;
        if (c / _a != _b) return 0;
        return c;
    }
    }

    /// Div uints
    /// @param _a uint
    /// @param _b uint
    /// @return uint
    function div(uint _a, uint _b) internal pure returns(uint) {
    unchecked {
        if (_b == 0) return 0;
        return _a / _b;
    }
    }
}
