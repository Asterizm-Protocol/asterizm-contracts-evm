const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("Checker test", function () {
    async function deployContractsFixture() {
        const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
        const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
        const Nonce = await ethers.getContractFactory("AsterizmNonce");
        const Checker = await ethers.getContractFactory("Checker");
        const [owner1, owner2] = await ethers.getSigners();
        const currentChainIds = [1, 2];
        const chainTypes = {EVM: 1, TVM: 2};

        const translator1 = await upgrades.deployProxy(Transalor, [currentChainIds[0], chainTypes.EVM], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await translator1.deployed();
        await translator1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
        await translator1.addRelayer(owner1.address);

        const translator2 = await upgrades.deployProxy(Transalor, [currentChainIds[1], chainTypes.EVM], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await translator2.deployed();
        await translator2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
        await translator2.addRelayer(owner1.address);

        // Initializer1 deployment
        const initializer1 = await upgrades.deployProxy(Initializer, [translator1.address], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await initializer1.deployed();
        // Initializer Nonce deployment
        const outboundInitializer1Nonce = await Nonce.deploy(initializer1.address);
        await outboundInitializer1Nonce.deployed();
        const inboundInitializer1Nonce = await Nonce.deploy(initializer1.address);
        await inboundInitializer1Nonce.deployed();
        await initializer1.setInBoundNonce(inboundInitializer1Nonce.address);
        await initializer1.setOutBoundNonce(outboundInitializer1Nonce.address);

        // Initializer2 deployment
        const initializer2 = await upgrades.deployProxy(Initializer, [translator2.address], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await initializer2.deployed();
        // Initializer Nonce deployment
        const outboundInitializer2Nonce = await Nonce.deploy(initializer2.address);
        await outboundInitializer2Nonce.deployed();
        const inboundInitializer2Nonce = await Nonce.deploy(initializer2.address);
        await inboundInitializer2Nonce.deployed();
        await initializer2.setInBoundNonce(inboundInitializer2Nonce.address);
        await initializer2.setOutBoundNonce(outboundInitializer2Nonce.address);

        await translator1.setInitializer(initializer1.address);
        await translator2.setInitializer(initializer2.address);

        const checker1 = await Checker.deploy(initializer1.address);
        await checker1.deployed();
        const checker2 = await Checker.deploy(initializer2.address);
        await checker2.deployed();
        await checker1.addTrustedAddresses(currentChainIds, [checker1.address, checker2.address]);
        await checker2.addTrustedAddresses(currentChainIds, [checker1.address, checker2.address]);

        // Fixtures can return anything you consider useful for your tests
        return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Checker, checker1, checker2, owner1, owner2, currentChainIds};
    }

    it("Should successfully deploy contracts", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Checker, checker1, checker2, owner1, owner2 } = await loadFixture(deployContractsFixture);
    });

    it("Should successfully send check message", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Checker, checker1, checker2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
        await expect(checker1.sendCheck([currentChainIds[1]])).not.to.be.reverted;

    })

    it("Should emit any event from Translator", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Checker, checker1, checker2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
        let feeValue, dstChainId, dstAddress, txId, transferHash, payload;
        await expect(checker1.sendCheck([currentChainIds[1]]))
            .to.emit(checker1, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(checker2.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        let PacketValue;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {PacketValue = value; return true;},
            );
    });

    it("Should send check message from packet to Initializer", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Checker, checker1, checker2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
        let feeValue, dstChainId, dstAddress, txId, transferHash, payload;
        await expect(checker1.sendCheck([currentChainIds[0]]))
            .to.emit(checker1, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[0]);
        expect(dstAddress).to.equal(checker1.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SuccessTransferEvent');

        await expect(checker1.sendCheck([currentChainIds[1]]))
            .to.emit(checker1, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(checker2.address);
        expect(txId).to.equal(1);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        let PacketValue;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {PacketValue = value; return true;},
            );
        await translator2.transferMessage(300000, PacketValue);
    });

    it("Should send check message from packet to Initializer", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Checker, checker1, checker2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
        let feeValue, dstChainId, dstAddress, txId, transferHash, payload;
        await expect(checker1.sendCheck([currentChainIds[0]]))
            .to.emit(checker1, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[0]);
        expect(dstAddress).to.equal(checker1.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SuccessTransferEvent');

        await expect(checker1.sendCheck([currentChainIds[1]]))
            .to.emit(checker1, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(checker2.address);
        expect(txId).to.equal(1);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        let PacketValue;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {PacketValue = value; return true;},
            );
        await translator2.transferMessage(300000, PacketValue);
    });

    it("Should not sent from/to blocked address, then success send check message", async function () {
        let PacketValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Checker, checker1, checker2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
        await expect(initializer1.addBlockAddress(currentChainIds[1], checker2.address))
            .to.emit(initializer1, 'AddBlockAddressEvent');
        await expect(checker1.sendCheck([currentChainIds[1]]))
            .to.emit(checker1, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(checker2.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.be.revertedWith("AsterizmInitializer: target address is blocked");

        await expect(initializer1.addBlockAddress(currentChainIds[0], checker1.address))
            .to.emit(initializer1, 'AddBlockAddressEvent');
        await expect(checker1.sendCheck([currentChainIds[1]]))
            .to.emit(checker1, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(checker2.address);
        expect(txId).to.equal(1);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.be.revertedWith("AsterizmInitializer: sender address is blocked");

        await expect(initializer1.removeBlockAddress(currentChainIds[0], checker1.address))
            .to.emit(initializer1, 'RemoveBlockAddressEvent');
        await expect(initializer1.removeBlockAddress(currentChainIds[1], checker2.address))
            .to.emit(initializer1, 'RemoveBlockAddressEvent');
        await expect(checker1.sendCheck([currentChainIds[0]]))
            .to.emit(checker1, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[0]);
        expect(dstAddress).to.equal(checker1.address);
        expect(txId).to.equal(2);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SuccessTransferEvent');

        await expect(checker1.sendCheck([currentChainIds[1]]))
            .to.emit(checker1, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(checker2.address);
        expect(txId).to.equal(3);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {PacketValue = value; return true;},
            );
        const messageBefore = await checker1.morseText();
        await translator2.transferMessage(300000, PacketValue);
        expect(await checker1.morseText()).to.equal(messageBefore);
    });

    it("Should send check message with fee", async function () {
        let PacketValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Checker, checker1, checker2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
        const provider = ethers.provider;
        const feeAmount = ethers.utils.parseEther("1");
        await translator1.transferOwnership(owner2.address);
        const owner2BalanceBefore = await provider.getBalance(owner2.address);
        expect(await provider.getBalance(checker1.address)).to.equal(0);
        expect(await provider.getBalance(translator1.address)).to.equal(0);
        let capturedValue;
        await expect(checker1.sendCheck([currentChainIds[1]]))
            .to.emit(checker1, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(checker2.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {capturedValue = value; return true;},
            );
        let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint64', 'uint', 'uint64', 'uint', 'bool', 'uint', 'bytes32'], capturedValue);
        expect(decodedValue[0]).to.not.null; // nonce
        expect(decodedValue[1]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[2]).to.equal(checker1.address); // srcAddress
        expect(decodedValue[3]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[4]).to.equal(checker2.address); // dstAddress
        expect(feeValue).to.equal(feeAmount); // feeValue
        expect(decodedValue[5]).to.equal(false); // useForceOrder
        expect(decodedValue[6]).to.equal(0); // txId
        expect(decodedValue[7]).to.not.null; // transferHash
        expect(await provider.getBalance(checker1.address)).to.equal(0);
        expect(await provider.getBalance(translator1.address)).to.equal(0);
        expect(await provider.getBalance(owner2.address)).to.equal(owner2BalanceBefore.add(feeAmount));
    });
});
