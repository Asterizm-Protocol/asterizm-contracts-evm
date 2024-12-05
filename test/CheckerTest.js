const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const bigInt = require("big-integer");

const pow = bigInt(10).pow(18);
describe("Checker test", function () {
    async function deployContractsFixture() {
        const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
        const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
        const Checker = await ethers.getContractFactory("Checker");
        const [owner1, owner2] = await ethers.getSigners();
        const currentChainIds = [1, 2];
        const chainTypes = {EVM: 1, TVM: 2};

        const translator1 = await upgrades.deployProxy(Transalor, [currentChainIds[0], chainTypes.EVM], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await translator1.waitForDeployment();
        await translator1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
        await translator1.addRelayer(owner1.address);

        const translator2 = await upgrades.deployProxy(Transalor, [currentChainIds[1], chainTypes.EVM], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await translator2.waitForDeployment();
        await translator2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
        await translator2.addRelayer(owner1.address);

        // Initializer1 deployment
        const initializer1 = await upgrades.deployProxy(Initializer, [await translator1.getAddress()], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await initializer1.waitForDeployment();

        // Initializer2 deployment
        const initializer2 = await upgrades.deployProxy(Initializer, [await translator2.getAddress()], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await initializer2.waitForDeployment();

        await translator1.setInitializer(await initializer1.getAddress());
        await translator2.setInitializer(await initializer2.getAddress());

        const checker1 = await Checker.deploy(await initializer1.getAddress());
        await checker1.waitForDeployment();
        const checker2 = await Checker.deploy(await initializer2.getAddress());
        await checker2.waitForDeployment();
        await checker1.addTrustedAddresses(currentChainIds, [await checker1.getAddress(), await checker2.getAddress()]);
        await checker2.addTrustedAddresses(currentChainIds, [await checker1.getAddress(), await checker2.getAddress()]);

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
        expect(dstAddress).to.equal(await checker2.getAddress());
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
        expect(dstAddress).to.equal(await checker1.getAddress());
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
        expect(dstAddress).to.equal(await checker2.getAddress());
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
        expect(dstAddress).to.equal(await checker1.getAddress());
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
        expect(dstAddress).to.equal(await checker2.getAddress());
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
        await expect(initializer1.addBlockAddress(currentChainIds[1], await checker2.getAddress()))
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
        expect(dstAddress).to.equal(await checker2.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.be.revertedWithCustomError(initializer1, 'CustomError')
            .withArgs(3007);

        await expect(initializer1.addBlockAddress(currentChainIds[0], await checker1.getAddress()))
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
        expect(dstAddress).to.equal(await checker2.getAddress());
        expect(txId).to.equal(1);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.be.revertedWithCustomError(initializer1, 'CustomError')
            .withArgs(3006);

        await expect(initializer1.removeBlockAddress(currentChainIds[0], await checker1.getAddress()))
            .to.emit(initializer1, 'RemoveBlockAddressEvent');
        await expect(initializer1.removeBlockAddress(currentChainIds[1], await checker2.getAddress()))
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
        expect(dstAddress).to.equal(await checker1.getAddress());
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
        expect(dstAddress).to.equal(await checker2.getAddress());
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
        const feeAmount = bigInt(1).multiply(pow.toString());
        await translator1.transferOwnership(owner2.address);
        const owner2BalanceBefore = bigInt(await provider.getBalance(owner2.address));
        expect(await provider.getBalance(await checker1.getAddress())).to.equal(0);
        expect(await provider.getBalance(await translator1.getAddress())).to.equal(0);
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
        expect(dstAddress).to.equal(await checker2.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(checker1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount.toString()}))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {capturedValue = value; return true;},
            );
        let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(await checker1.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(await checker2.getAddress()); // dstAddress
        expect(feeValue).to.equal(feeAmount.toString()); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(false); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        expect(await provider.getBalance(await checker1.getAddress())).to.equal(0);
        expect(await provider.getBalance(await translator1.getAddress())).to.equal(0);
        expect(await provider.getBalance(owner2.address)).to.equal(owner2BalanceBefore.add(feeAmount.toString()).toString());
    });
});
