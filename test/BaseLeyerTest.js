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
    let chainIds = [];
    for (let i = 0; i < currentChainIds.length; i++) {
      chainIds.push(currentChainIds[i]);
    }

    const translator1 = await Transalor.deploy(currentChainIds[0]);
    await translator1.deployed();
    await translator1.addChains(chainIds);
    await translator1.addRelayer(owner1.address);

    const translator2 = await Transalor.deploy(currentChainIds[1]);
    await translator2.deployed();
    await translator2.addChains(chainIds);
    await translator2.addRelayer(owner1.address);

    // Initializer1 deployment
    const initializer1 = await Initializer.deploy(translator1.address);
    await initializer1.deployed();
    await initializer1.setIsDecSendAvailable(true);
    await initializer1.setIsEncSendAvailable(true);
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
    await initializer2.setIsDecSendAvailable(true);
    await initializer2.setIsEncSendAvailable(true);
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
    await demo1.addTrustedSourceAddresses(currentChainIds, [demo1.address, demo2.address]);
    await demo2.addTrustedSourceAddresses(currentChainIds, [demo1.address, demo2.address]);

    // Fixtures can return anything you consider useful for your tests
    return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds};
  }

  it("Should successfully deploy contracts", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2 } = await loadFixture(deployContractsFixture);
  });

  it("Should successfully send message", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message")).not.to.be.reverted;

  })

  it("Should emit any event from Translator", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message"))
      .to.emit(translator1, 'SendMessageEvent')
  });

  it("Should send message from packet to Initializer", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(demo1.sendMessage(currentChainIds[0], demo1.address, "New message"))
        .to.emit(translator1, 'SuccessTransferEvent');
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message"))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(captureValue)
    await translator2.transferMessage(300000, capturedValue);
  });

  it("Should get exception for decode method not available on initializer", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    await initializer1.setIsDecSendAvailable(false);
    expect(await initializer1.isDecSendAvailable()).to.equal(false);
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message"))
        .to.be.revertedWith("AsterizmInitializer: decode transfer is unavailable");
    await initializer1.setIsDecSendAvailable(true);
    expect(await initializer1.isDecSendAvailable()).to.equal(true);
  });

  it("Should send message from packet to Initializer", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(demo1.sendMessage(currentChainIds[0], demo1.address, "New message"))
        .to.emit(translator1, 'SuccessTransferEvent');
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message"))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(captureValue);
    const messageBefore = await demo1.externalChainMessage();
    await translator2.transferMessage(300000, capturedValue);
    expect(await demo1.externalChainMessage()).to.equal(messageBefore);
  });

  it("Should not sent from/to blocked address, then success send message", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(initializer1.addBlockAddress(demo2.address))
        .to.emit(initializer1, 'AddBlockAddressEvent');
    await expect(demo1.sendMessage(currentChainIds[0], demo2.address, "New message"))
        .to.be.revertedWith("AsterizmInitializer: target address is blocked");
    await expect(initializer1.addBlockAddress(demo1.address))
        .to.emit(initializer1, 'AddBlockAddressEvent');
    await expect(demo1.sendMessage(currentChainIds[0], demo2.address, "New message"))
        .to.be.revertedWith("AsterizmInitializer: sender address is blocked");
    await expect(initializer1.removeBlockAddress(demo1.address))
        .to.emit(initializer1, 'RemoveBlockAddressEvent');
    await expect(initializer1.removeBlockAddress(demo2.address))
        .to.emit(initializer1, 'RemoveBlockAddressEvent');
    await expect(demo1.sendMessage(currentChainIds[0], demo1.address, "New message"))
        .to.emit(translator1, 'SuccessTransferEvent');
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message"))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(captureValue);
    const messageBefore = await demo1.externalChainMessage();
    await translator2.transferMessage(300000, capturedValue);
    expect(await demo1.externalChainMessage()).to.equal(messageBefore);
  });

  it("Should nonce and duplicate transfers validation is working", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    let capturedValue1, capturedValue2;
    const message1 = 'New message 1';
    const message2 = 'New message 2';
    await expect(demo1.sendMessage(currentChainIds[1], demo2.address, message1))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs((value) => {capturedValue1 = value; return true;});
    await expect(demo1.sendMessage(currentChainIds[1], demo2.address, message2))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs((value) => {capturedValue2 = value; return true;});
    await expect(translator2.transferMessage(300000, capturedValue2))
        .to.be.revertedWith("AsterismNonce: wrong nonce");
    await expect(translator2.transferMessage(300000, capturedValue1))
        .to.emit(demo2, 'SetExternalChainMessageEvent');
    expect(await demo2.externalChainMessage()).to.equal(message1);
    await expect(translator2.transferMessage(300000, capturedValue1))
        .to.be.revertedWith("AsterizmInitializer: message sent already");
    await expect(translator2.transferMessage(300000, capturedValue2))
        .to.emit(demo2, 'SetExternalChainMessageEvent');
    expect(await demo2.externalChainMessage()).to.equal(message2);
  });

  it("Should send message with fee", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner1, owner2, currentChainIds } = await loadFixture(deployContractsFixture);
    const provider = ethers.provider;
    const feeAmount = ethers.utils.parseEther("1");
    await translator1.transferOwnership(owner2.address);
    const owner2BalanceBefore = await provider.getBalance(owner2.address);
    expect(await provider.getBalance(demo1.address)).to.equal(0);
    expect(await provider.getBalance(translator1.address)).to.equal(0);
    let capturedValue;
    await expect(demo1.sendMessage(currentChainIds[1], demo2.address, "New message", {value: feeAmount}))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs((value) => {capturedValue = value; return true;});
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint64', 'address', 'uint64', 'address', 'uint', 'bool', 'bool', 'uint', 'bytes32', 'bytes'], capturedValue);
    // decodedValue[0] - nonce
    expect(decodedValue[1]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[2]).to.equal(demo1.address); // srcAddress
    expect(decodedValue[3]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[4]).to.equal(demo2.address); // dstAddress
    expect(decodedValue[5]).to.equal(feeAmount); // feeValue
    expect(decodedValue[6]).to.equal(false); // useEncryption
    expect(decodedValue[7]).to.equal(true); // useForceOrder
    expect(decodedValue[8]).to.equal(0); // txId
    expect(decodedValue[9]).to.not.null; // transferHash
    // decodedValue[10] - payload
    expect(await provider.getBalance(demo1.address)).to.equal(0);
    expect(await provider.getBalance(translator1.address)).to.equal(0);
    expect(await provider.getBalance(owner2.address)).to.equal(owner2BalanceBefore.add(feeAmount));
  });
});
