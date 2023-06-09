// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract TestContract {

    constructor() {}
    
    // function _buildHash(uint64 _srcChainId, uint64 _dstChainId, uint _srcAddress, uint _dstAddress, string memory _str) private pure returns(bytes32) {
    //     return sha256(abi.encodePacked(_srcChainId, _dstChainId, _srcAddress, _dstAddress, stringHash(_str)));
    //     // return sha256(abi.encodePacked(_srcChainId, _dstChainId, _srcAddress, _dstAddress, _srcChainId, _dstChainId, _srcAddress, _dstAddress, _srcChainId, _dstChainId, _srcAddress, stringHash(_str)));
    // }

    // event GetHashEvent(bytes32 _hash);
    // function getHash(uint64 _srcChainId, uint64 _dstChainId, uint _srcAddress, uint _dstAddress, string memory _str) public {
    //     emit GetHashEvent(_buildHash(_srcChainId, _dstChainId, _srcAddress, _dstAddress, _str));
    // }

    // event CheckHashEvent(bool _result, uint _hash, bytes32 _resultHash);
    // function checkHash(uint64 _srcChainId, uint64 _dstChainId, uint _srcAddress, uint _dstAddress, string memory _str, uint _hash) public {
    //     bytes32 resultHash = _buildHash(_srcChainId, _dstChainId, _srcAddress, _dstAddress, _str);

    //     emit CheckHashEvent(resultHash == bytes32(_hash), _hash, resultHash);
    // }



    // event TestDecodeEvent(string _str, bytes32 _hash);
    // function testDecode(string memory _str) public {
    //     emit TestDecodeEvent(_str, stringHash(_str));
    // }

    // function stringHash(string memory _str) internal pure returns(bytes32) {
    //     return bytesHash(bytes(_str));
    // }

    // function bytesHash(bytes memory _data) internal pure returns(bytes32) {
    //     uint length = _data.length;
    //     uint8 chankLength = 127;
    //     uint chankCount = length / chankLength;
    //     if (length % chankLength > 0) {
    //         chankCount++;
    //     }

    //     bytes32 resHash;
    //     for (uint i = 0; i < chankCount; i++) {
    //         uint from = chankLength * i;
    //         uint to = from + chankLength;
    //         bytes memory chank = slice(_data, from, (to <= length ? chankLength : (length - from)));

    //         resHash = sha256(abi.encode(resHash, sha256(chank)));
    //     }

    //     return resHash;
    // }

    // function slice(bytes memory _bytes, uint256 _start, uint256 _length) internal pure returns (bytes memory) {
    //     require(_length + 31 >= _length, "slice_overflow");
    //     require(_bytes.length >= _start + _length, "slice_outOfBounds");

    //     bytes memory tempBytes;

    //     assembly {
    //         switch iszero(_length)
    //         case 0 {
    //             tempBytes := mload(0x40)
    //             let lengthmod := and(_length, 31)
    //             let mc := add(add(tempBytes, lengthmod), mul(0x20, iszero(lengthmod)))
    //             let end := add(mc, _length)

    //             for {
    //                 let cc := add(add(add(_bytes, lengthmod), mul(0x20, iszero(lengthmod))), _start)
    //             } lt(mc, end) {
    //                 mc := add(mc, 0x20)
    //                 cc := add(cc, 0x20)
    //             } {
    //                 mstore(mc, mload(cc))
    //             }

    //             mstore(tempBytes, _length)
    //             mstore(0x40, and(add(mc, 31), not(31)))
    //         }
    //         default {
    //             tempBytes := mload(0x40)
    //             mstore(tempBytes, 0)
    //             mstore(0x40, add(tempBytes, 0x20))
    //         }
    //     }

    //     return tempBytes;
    // }



    // event Test1Event(bool _equal, bytes32 _hash1, bytes32 _hash2);
    // function testHash(string memory _str1, string memory _str2) public {
    //     bytes32 resHash1 = sha256(bytes(_str1));
    //     bytes32 resHash2 = sha256(bytes(_str2));
    //     emit Test1Event(resHash1 == resHash2, resHash1, resHash2);
    // }




//    event TestAbiEvent(bytes _payload, bytes _payloadPacked);
//    function testAbi() public {
//        string memory stringVal = "stepan_pird_228";
//        bool boolVal = true;
//        int32 int321Val = -100;
//        int32 int322Val = 100;
//        int int1Val = -10000;
//        int int2Val = 10000;
//        int24 int24Val = 24;
//        int40 int40Val = 40;
//        uint32 uint32Val = 100;
//        uint uintVal = 10000;
//        bytes memory bytesVal = bytes(stringVal);
//        emit TestAbiEvent(
//            abi.encode(stringVal, boolVal, int321Val, int322Val, int1Val, int2Val, int24Val, int40Val, uint32Val, uintVal, bytesVal),
//            abi.encodePacked(stringVal, boolVal, int321Val, int322Val, int1Val, int2Val, int24Val, int40Val, uint32Val, uintVal, bytesVal)
//        );
//    }

//    event ParceAbiEvent(string stringVal, bool boolVal, int32 int321Val, int32 int322Val, int int1Val, int int2Val, int24 int24Val, int40 int40Val, uint32 uint32Val, uint uintVal, bytes bytesVal);
//    function parceAbi(bytes memory _payload) public {
//        (string memory stringVal, bool boolVal, int32 int321Val, int32 int322Val, int int1Val, int int2Val, int24 int24Val, int40 int40Val, uint32 uint32Val, uint uintVal, bytes memory bytesVal) = abi.decode(
//            _payload, (string, bool, int32, int32, int, int, int24, int40, uint32, uint, bytes)
//        );

//        emit ParceAbiEvent(stringVal, boolVal, int321Val, int322Val, int1Val, int2Val, int24Val, int40Val, uint32Val, uintVal, bytesVal);
//    }

    // event DecodeAbiEvent(uint dstAddressUint, uint amount, uint txId , uint tokenAddressUint, uint8 decimals, uint stableRate);
    // function decodeAbi(bytes memory _payload) public {
    //     (uint dstAddressUint, uint amount, uint txId , uint tokenAddressUint, uint8 decimals, uint stableRate) = abi.decode(_payload, (uint256, uint64, uint256, uint64, uint256, bool, uint256, uint256, bytes));
    //     emit DecodeAbiEvent(dstAddressUint, amount, txId, tokenAddressUint, decimals, stableRate);
    // }

    // event EncodeAbiEvent(bytes _payload);
    // function encodeAbi(uint dstAddressUint, uint amount, uint txId , uint tokenAddressUint, uint8 decimals, uint stableRate) public {
    //     bytes memory payload = abi.encode(dstAddressUint, amount, txId, tokenAddressUint, decimals, stableRate);
    //     emit EncodeAbiEvent(payload);
    // }
}
