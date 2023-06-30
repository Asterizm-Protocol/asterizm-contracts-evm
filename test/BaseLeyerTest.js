const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("Base layer test", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializer");
    const Transalor = await ethers.getContractFactory("AsterizmTranslator");
    const Nonce = await ethers.getContractFactory("AsterizmNonce");
    const Demo = await ethers.getContractFactory("AsterizmDemo");
    const [owner1, owner2] = await ethers.getSigners();
    const currentChainIds = [1, 2];
    const chainTypes = {EVM: 1, TVM: 2};

    const translator1 = await Transalor.deploy(currentChainIds[0], chainTypes.EVM);
    await translator1.deployed();
    await translator1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
    await translator1.addRelayer(owner1.address);

    const translator2 = await Transalor.deploy(currentChainIds[1], chainTypes.EVM);
    await translator2.deployed();
    await translator2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
    await translator2.addRelayer(owner1.address);

    // Initializer1 deployment
    const initializer1 = await Initializer.deploy(translator1.address);
    await initializer1.deployed();
    // Initializer Nonce deployment
    const outboundInitializer1Nonce = await Nonce.deploy(initializer1.address);
    await outboundInitializer1Nonce.deployed();
    const inboundInitializer1Nonce = await Nonce.deploy(initializer1.address);
    await inboundInitializer1Nonce.deployed();
    await initializer1.setInBoundNonce(inboundInitializer1Nonce.address);
    await initializer1.setOutBoundNonce(outboundInitializer1Nonce.address);

    // Initializer2 deployment
    const initializer2 = await Initializer.deploy(translator2.address);
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

    const demo1 = await Demo.deploy(initializer1.address);
    await demo1.deployed();
    const demo2 = await Demo.deploy(initializer2.address);
    await demo2.deployed();
    await demo1.addTrustedAddresses(currentChainIds, [demo1.address, demo2.address]);
    await demo2.addTrustedAddresses(currentChainIds, [demo1.address, demo2.address]);

    // Fixtures can return anything you consider useful for your tests
    return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds};
  }

  it("Should successfully deploy contracts", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2 } = await loadFixture(deployContractsFixture);
  });

  it("Should successfully send message", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(demo1.sendMessage(currentChainIds[1], "New message")).not.to.be.reverted;

  })

  it("Should emit any event from Translator", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    let feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    await expect(demo1.sendMessage(currentChainIds[1], "New message"))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    let PacketValue;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
  });

  it("Should send message from packet to Initializer", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    let feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    await expect(demo1.sendMessage(currentChainIds[0], "New message"))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[0]);
    expect(dstAddress).to.equal(demo1.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
        .to.emit(translator1, 'SuccessTransferEvent');

    await expect(demo1.sendMessage(currentChainIds[1], "New message"))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    let PacketValue;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    await translator2.transferMessage(300000, PacketValue);
  });

  it("Should send message from packet to Initializer", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    let feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    await expect(demo1.sendMessage(currentChainIds[0], "New message"))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[0]);
    expect(dstAddress).to.equal(demo1.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
        .to.emit(translator1, 'SuccessTransferEvent');

    await expect(demo1.sendMessage(currentChainIds[1], ""))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    let PacketValue;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    await translator2.transferMessage(300000, PacketValue);
  });

  it("Should not sent from/to blocked address, then success send message", async function () {
    let PacketValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);

    await expect(initializer1.addBlockAddress(currentChainIds[1], demo2.address))
        .to.emit(initializer1, 'AddBlockAddressEvent');
    await expect(demo1.sendMessage(currentChainIds[1], "New message"))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
        .to.be.revertedWith("AsterizmInitializer: target address is blocked");

    await expect(initializer1.addBlockAddress(currentChainIds[0], demo1.address))
        .to.emit(initializer1, 'AddBlockAddressEvent');
    await expect(demo1.sendMessage(currentChainIds[1], "New message"))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
        .to.be.revertedWith("AsterizmInitializer: sender address is blocked");

    await expect(initializer1.removeBlockAddress(currentChainIds[0], demo1.address))
        .to.emit(initializer1, 'RemoveBlockAddressEvent');
    await expect(initializer1.removeBlockAddress(currentChainIds[1], demo2.address))
        .to.emit(initializer1, 'RemoveBlockAddressEvent');
    await expect(demo1.sendMessage(currentChainIds[0], "New message"))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[0]);
    expect(dstAddress).to.equal(demo1.address);
    expect(txId).to.equal(2);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
        .to.emit(translator1, 'SuccessTransferEvent');

    await expect(demo1.sendMessage(currentChainIds[1], "New message"))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(3);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    const messageBefore = await demo1.externalChainMessage();
    await translator2.transferMessage(300000, PacketValue);
    expect(await demo1.externalChainMessage()).to.equal(messageBefore);
  });

  it("Should send message with fee", async function () {
    let PacketValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    const provider = ethers.provider;
    const feeAmount = ethers.utils.parseEther("1");
    await translator1.transferOwnership(owner2.address);
    const owner2BalanceBefore = await provider.getBalance(owner2.address);
    expect(await provider.getBalance(demo1.address)).to.equal(0);
    expect(await provider.getBalance(translator1.address)).to.equal(0);
    let capturedValue;
    await expect(demo1.sendMessage(currentChainIds[1], "New message"))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, payload, {value: feeAmount}))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint64', 'uint', 'uint64', 'uint', 'bool', 'uint', 'bytes32', 'bytes'], capturedValue);
    expect(decodedValue[0]).to.not.null; // nonce
    expect(decodedValue[1]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[2]).to.equal(demo1.address); // srcAddress
    expect(decodedValue[3]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[4]).to.equal(demo2.address); // dstAddress
    expect(feeValue).to.equal(feeAmount); // feeValue
    expect(decodedValue[5]).to.equal(true); // useForceOrder
    expect(decodedValue[6]).to.equal(0); // txId
    expect(decodedValue[7]).to.not.null; // transferHash
    expect(decodedValue[8]).to.not.null; // payload
    expect(await provider.getBalance(demo1.address)).to.equal(0);
    expect(await provider.getBalance(translator1.address)).to.equal(0);
    expect(await provider.getBalance(owner2.address)).to.equal(owner2BalanceBefore.add(feeAmount));
  });
});
