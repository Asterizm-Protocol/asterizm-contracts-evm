// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IInitializerSender.sol";
import "../interfaces/IClientReceiverContract.sol";
import "./BaseAsterizmEnv.sol";

abstract contract BaseAsterizmClient is Ownable, ReentrancyGuard, IClientReceiverContract, BaseAsterizmEnv {

    /// Add admin event
    /// @param _adminAddress address  Admin address
    event AddAdminEvent(address _adminAddress);

    /// Remove admin event
    /// @param _adminAddress address  Admin address
    event RemoveAdminEvent(address _adminAddress);

    /// Set initializer event
    /// @param _initializerAddress address  Initializer address
    event SetInitializerEvent(address _initializerAddress);

    /// Initiate transfer event (for client server logic)
    /// @param _dstChainId uint64  Destination chein ID
    /// @param _dstAddress address  Destination address
    /// @param _txId uint  Transaction ID
    /// @param _transferHash bytes32  Transfer hash
    /// @param _payload bytes  Payload
    event InitiateTransferEvent(uint64 _dstChainId, address _dstAddress, uint _txId, bytes32 _transferHash, bytes _payload);

    /// Encoded payload receive event (for client server logic)
    /// @param _srcChainId uint64  Source chain ID
    /// @param _srcAddress address  Source address
    /// @param _nonce uint  Transaction nonce
    /// @param _transferHash bytes32  Transaction hash
    /// @param _payload bytes  Payload
    event EncodedPayloadReceivedEvent(uint64 _srcChainId, address _srcAddress, uint _nonce, bytes32 _transferHash, bytes _payload);

    /// Add trusted address event
    /// @param _chainId uint64  Chain ID
    /// @param _address address  Trusted address
    event AddTrustedSourceAddressEvent(uint64 _chainId, address _address);

    /// Remove trusted address event
    /// @param _chainId uint64  Chain ID
    /// @param _address address  Trusted address
    event RemoveTrustedSourceAddressEvent(uint64 _chainId, address _address);

    /// Set use encryption flag
    /// @param _flag bool  Use encryption flag
    event SetUseEncryptionEvent(bool _flag);

    /// Set use force order flag
    /// @param _flag bool  Use force order flag
    event SetUseForceOrderEvent(bool _flag);

    struct AsterizmTransfer {
        bool successReceive;
        bool successExecute;
    }

    IInitializerSender private initializerLib;
    mapping(address => bool) private admins;
    mapping(uint64 => address) private trustedSrcAddresses;
    mapping(bytes32 => AsterizmTransfer) private transfers;
    uint private trustedAddressCount;
    bool private useEncryption;
    bool private useForceOrder;
    uint private txId;

    constructor(IInitializerSender _initializerLib, bool _useEncryption, bool _useForceOrder) {
        _setInitializer(_initializerLib);
        _setUseEncryption(_useEncryption);
        _setUseForceOrder(_useForceOrder);
    }

    /// Only admin modifier
    modifier onlyAdmin {
        require(admins[msg.sender], "BaseAsterizmClient: only admin");
        _;
    }

    /// Only owner or admin modifier
    modifier onlyOwnerOrAdmin {
        require(msg.sender == owner() || admins[msg.sender], "BaseAsterizmClient: only owner or admin");
        _;
    }

    /// Only initializer modifier
    modifier onlyInitializer {
        require(msg.sender == address(initializerLib), "BaseAsterizmClient: only initializer");
        _;
    }

    /// Only owner or initializer modifier
    modifier onlyOwnerOrInitializer {
        require(msg.sender == owner() || msg.sender == address(initializerLib), "BaseAsterizmClient: only owner or initializer");
        _;
    }

    /// Only trusted source address modifier
    /// You must add trusted source addresses in production networks!
    modifier onlyTrusterSrcAddress(uint64 _chainId, address _address) {
        if (trustedAddressCount > 0) {
            require(trustedSrcAddresses[_chainId] == _address, "BaseAsterizmClient: wrong source address");
        }
        _;
    }

    /// Only trusted trarnsfer modifier
    /// Validate transfer hash on initializer
    /// Use this modifier for validate transfer by hash
    /// @param _transferHash bytes32  Transfer hash
    modifier onlyTrusterTransfer(bytes32 _transferHash) {
        require(initializerLib.validIncomeTarnsferHash(_transferHash), "BaseAsterizmClient: transfer hash is invalid");
        _;
    }

    /// Only encryption logic modifier
    modifier onlyEncryption() {
        require(useEncryption, "BaseAsterizmClient: only encryption logic");
        _;
    }

    /// Set receive transfer modifier
    /// @param _transferHash bytes32  Transfer hash
    modifier setReceiveTransfer(bytes32 _transferHash) {
        _;
        transfers[_transferHash].successReceive = true;
    }

    /// Set execute transfer modifier
    /// @param _transferHash bytes32  Transfer hash
    modifier setExecuteTransfer(bytes32 _transferHash) {
        _;
        transfers[_transferHash].successReceive = true;
        transfers[_transferHash].successExecute = true;
    }

    /// Only received transfer modifier
    /// @param _transferHash bytes32  Transfer hash
    modifier onlyReceivedTransfer(bytes32 _transferHash) {
        if (useEncryption) {
            require(transfers[_transferHash].successReceive, "BaseAsterizmClient: transfer not received");
        }
        _;
    }

    /// Only non-executed transfer modifier
    /// @param _transferHash bytes32  Transfer hash
    modifier onlyNonExecuted(bytes32 _transferHash) {
        require(!transfers[_transferHash].successExecute, "BaseAsterizmClient: transfer executed already");
        _;
    }

    /** Internal logic */

    /// Add admin (only for owner)
    /// @param _adminAddress address  Admin address
    function addAdmin(address _adminAddress) external onlyOwner {
        admins[_adminAddress] = true;
        emit AddAdminEvent(_adminAddress);
    }

    /// Remove admin (only for owner)
    /// @param _adminAddress address  Admin address
    function removeAdmin(address _adminAddress) external onlyOwner {
        delete admins[_adminAddress];
        emit RemoveAdminEvent(_adminAddress);
    }

    /// Set initizlizer library
    /// _initializerLib IInitializerSender  Initializer library
    function _setInitializer(IInitializerSender _initializerLib) private onlyOwnerOrAdmin {
        initializerLib = _initializerLib;
        emit SetInitializerEvent(address(_initializerLib));
    }

    /// Set use encryption flag
    /// _flag bool  Use encryption flag
    function _setUseEncryption(bool _flag) private onlyOwner {
        useEncryption = _flag;
        emit SetUseEncryptionEvent(_flag);
    }

    /// Set use force order flag
    /// _flag bool  Use force order flag
    function _setUseForceOrder(bool _flag) private onlyOwner {
        useForceOrder = _flag;
        emit SetUseForceOrderEvent(_flag);
    }

    /// Add trusted source address
    /// @param _chainId uint64  Chain ID
    /// @param _trustedAddress address  Trusted address
    function addTrustedSourceAddress(uint64 _chainId, address _trustedAddress) public onlyOwner {
        bool shouldIncCount = trustedSrcAddresses[_chainId] == address(0);
        trustedSrcAddresses[_chainId] = _trustedAddress;
        if (shouldIncCount) {
            trustedAddressCount++;
        }
        emit AddTrustedSourceAddressEvent(_chainId, _trustedAddress);
    }

    /// Add trusted source addresses
    /// @param _chainIds uint64[]  Chain IDs
    /// @param _trustedAddresses address[]  Trusted addresses
    function addTrustedSourceAddresses(uint64[] calldata _chainIds, address[] calldata _trustedAddresses) external onlyOwner {
        for (uint i = 0; i < _chainIds.length; i++) {
            addTrustedSourceAddress(_chainIds[i], _trustedAddresses[i]);
        }
    }

    /// Remove trusted address
    /// @param _chainId uint64  Chain ID
    function removeTrustedSourceAddress(uint64 _chainId) external onlyOwner {
        require(trustedSrcAddresses[_chainId] != address(0), "BaseAsterizmClient: trusted address not found");
        address removingAddress = trustedSrcAddresses[_chainId];
        delete trustedSrcAddresses[_chainId];
        trustedAddressCount--;
        emit RemoveTrustedSourceAddressEvent(_chainId, removingAddress);
    }

    /// Build transfer hash
    /// @param _chainId uint64  Chain ID
    /// @param _address address  Address
    /// @param _txId uint  Transaction ID
    /// @param _payload bytes  Payload
    function _buildTransferHash(uint64 _chainId, address _address, uint _txId, bytes memory _payload) internal pure returns(bytes32) {
        return keccak256(abi.encode(_chainId, _address, _txId, _payload));
    }

    /// Check is transfer hash valid
    /// @param _chainId uint64  Chain ID
    /// @param _address address  Address
    /// @param _txId uint  Transaction ID
    /// @param _payload bytes  Payload
    /// @param _transferHash bytes32  Transfer hash
    function _validTransferHash(uint64 _chainId, address _address, uint _txId, bytes memory _payload, bytes32 _transferHash) internal pure returns(bool) {
        return _buildTransferHash(_chainId, _address, _txId, _payload) == _transferHash;
    }

    /// Return txId
    /// @return uint
    function _getTxId() internal view returns(uint) {
        return txId;
    }

    /** External logic */

    /** Sending logic */

    /// External initiation transfer
    /// This function needs for external initiating non-encoded payload transfer
    /// @param _dto ClInitTransferRequestDto  Init transfer DTO
    function initAsterizmTransfer(ClInitTransferRequestDto memory _dto) external payable onlyOwner nonReentrant {
        _dto.feeAmount = msg.value;
        _initAsterizmTransferInternal(_dto);
    }

    /// Internal initiation transfer
    /// This function needs for internal initiating non-encoded payload transfer
    /// @param _dto ClInitTransferRequestDto  Init transfer DTO
    function _initAsterizmTransferInternal(ClInitTransferRequestDto memory _dto) internal {
        require(address(this).balance >= _dto.feeAmount, "BaseAsterizmClient: contract balance is not enough");
        IzIninTransferRequestDto memory dto = _buildIzIninTransferRequestDto(_dto.dstChainId, _dto.dstAddress, _dto.txId, _dto.transferHash, useEncryption, useForceOrder, _dto.payload);
        initializerLib.initTransfer{value: _dto.feeAmount} (dto);
    }

    /// Initiate transfer event
    /// Generate event for client server
    /// @param _dto ClInitTransferEventDto  Init transfer DTO
    function _initAsterizmTransferEvent(ClInitTransferEventDto memory _dto) internal {
        uint id = txId++;
        emit InitiateTransferEvent(_dto.dstChainId, _dto.dstAddress, id, _buildTransferHash(_dto.dstChainId, _dto.dstAddress, id, _dto.payload), _dto.payload);
    }

    /** Receiving logic */

    /// Receive payload from initializer
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function asterizmIzReceive(ClAsterizmReceiveRequestDto calldata _dto) external onlyInitializer nonReentrant {
        useEncryption ? _asterizmReceiveEncoded(_dto) : _asterizmReceive(_dto);
    }

    /// Receive payload from client server
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function asterizmClReceive(ClAsterizmReceiveRequestDto calldata _dto) external onlyOwner onlyEncryption nonReentrant {
        _asterizmReceive(_dto);
    }

    /// Receive non-encoded payload
    /// You must realize this function if you want to transfer non-encoded payload
    /// You must use onlyTrusterSrcAddress modifier!
    /// Validate transferHash with validTransferHash() for more security
    /// For validate transfer you can use onlyTrusterTransfer modifier
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceive(ClAsterizmReceiveRequestDto calldata _dto) internal virtual
        onlyOwnerOrInitializer
        onlyNonExecuted(_dto.transferHash)
        onlyReceivedTransfer(_dto.transferHash)
        onlyTrusterSrcAddress(_dto.srcChainId, _dto.srcAddress)
        onlyTrusterTransfer(_dto.transferHash)
        setExecuteTransfer(_dto.transferHash) {}

    /// Receive encoded payload
    /// This methos needs for transfer encoded data
    /// You must use onlyTrusterSrcAddress modifier!
    /// For validate transfer you can use onlyTrusterTransfer modifier
    /// @param _dto ClAsterizmReceiveRequestDto  Method DTO
    function _asterizmReceiveEncoded(ClAsterizmReceiveRequestDto calldata _dto) internal
        onlyOwnerOrInitializer
        onlyEncryption
        onlyNonExecuted(_dto.transferHash)
        onlyTrusterSrcAddress(_dto.srcChainId, _dto.srcAddress)
        onlyTrusterTransfer(_dto.transferHash)
        setReceiveTransfer(_dto.transferHash)
    {
        require(useEncryption, "BaseAsterizmClient: wrong encryption param");
        emit EncodedPayloadReceivedEvent(_dto.srcChainId, _dto.srcAddress, _dto.nonce, _dto.transferHash, _dto.payload);
    }
}
