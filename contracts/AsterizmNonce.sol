// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/INonce.sol";

/// Asterizm nonce contract
contract AsterizmNonce is INonce, Ownable {

    /// Set manipulator event
    /// @param _address address  Manipulator address
    event SetManipulatorEvent(address _address);

    /// Force set nonce event
    /// @param _chainId uint64  Chain ID
    /// @param _pathData bytes  Path data
    /// @param _nonce uint  Nonce
    event ForceSetNonceEvent(uint64 _chainId, bytes _pathData, uint _nonce);

    /// Nonce increacement event
    /// @param _chainId uint64  Chain ID
    /// @param _pathData bytes  Path data
    /// @param _nonce uint  Nonce
    event NonceIncreacementEvent(uint64 _chainId, bytes _pathData, uint _nonce);

    mapping(uint64 => mapping(bytes => uint)) private nonce;
    address private manipulator;

    constructor(address _manipulatorAddress) {
        _setManipulator(_manipulatorAddress);
    }

    /// Only manipulator modifier
    modifier onlyManipulator() {
        require(manipulator == msg.sender, "AsterismNonce: only manipulator");
        _;
    }

    /// Set manipulator (only owner)
    function _setManipulator(address _manipulator) internal onlyOwner {
        manipulator = _manipulator;
        emit SetManipulatorEvent(_manipulator);
    }

    /// Increase nonce
    /// @param _chainId uint64  Chain ID
    /// @param _pathData bytes  Nonce data
    function increaseNonce(uint64 _chainId, bytes calldata _pathData) public onlyManipulator returns (uint) {
        emit NonceIncreacementEvent(_chainId, _pathData, ++nonce[_chainId][_pathData]);

        return getNonce(_chainId, _pathData);
    }

    /// Increase nonce with validation
    /// @param _chainId uint64  Chain ID
    /// @param _nonce uint  External nonce
    /// @param _pathData bytes  Path data
    function increaseNonceWithValidation(uint64 _chainId, bytes calldata _pathData, uint _nonce) public onlyManipulator returns (uint) {
        uint currentNonce = getNonce(_chainId, _pathData);
        require(_nonce == currentNonce + 1, "AsterismNonce: wrong nonce");

        return increaseNonce(_chainId, _pathData);
    }

    /// Return nonce
    /// @param _chainId uint64  Chain ID
    /// @param _pathData bytes  Path data
    function getNonce(uint64 _chainId, bytes calldata _pathData) public view returns (uint) {
        return nonce[_chainId][_pathData];
    }

    /// Return nonce (base logic)
    /// @param _chainId uint64  Chain ID
    /// @param _srcAddress uint  Source address
    /// @param _dstAddress uint  Destination address
    function getNonceBase(uint64 _chainId, uint _srcAddress, uint _dstAddress) public view returns (uint) {
        return nonce[_chainId][abi.encodePacked(_srcAddress, _dstAddress)];
    }

    /// Force set nonce
    /// @param _chainId uint64  Chain ID
    /// @param _pathData bytes  Path data
    /// @param _nonce uint  External nonce
    function forceSetNonce(uint64 _chainId, bytes calldata _pathData, uint _nonce) external onlyOwner returns (uint) {
        nonce[_chainId][_pathData] = _nonce;
        emit ForceSetNonceEvent(_chainId, _pathData, _nonce);

        return getNonce(_chainId, _pathData);
    }
}
