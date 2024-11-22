// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract AsterizmChainEnv is Initializable {

    uint8 constant private CHAIN_TYPE_EVM = 1;
    uint8 constant private CHAIN_TYPE_TVM = 2;
    uint8 constant private CHAIN_TYPE_TON = 3;
    uint8 constant private CHAIN_TYPE_SOL = 4;

    uint[50] private __gap;

    struct ChainType {
        bool exists;
    }

    mapping(uint8 => ChainType) private chainTypes;

    /// Contract initializer (constructor)
    function __AsterizmChainEnv_init() initializer public {
        internalUpdateChainTypesList();
    }

    /// Internal update chain types list
    function internalUpdateChainTypesList() internal {
        chainTypes[CHAIN_TYPE_EVM].exists = true;
        chainTypes[CHAIN_TYPE_TVM].exists = true;
        chainTypes[CHAIN_TYPE_TON].exists = true;
        chainTypes[CHAIN_TYPE_SOL].exists = true;
    }

    /// Check is chain type awailable
    /// @param _chainType uint8  Chain type
    /// @return bool  Chain type awailable flag
    function _isChainTypeAwailable(uint8 _chainType) internal view returns(bool) {
        return chainTypes[_chainType].exists;
    }
}
