const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("Base layer test", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializer");
    const Transalor = await ethers.getContractFactory("AsterizmTranslator");
    const Nonce = await ethers.getContractFactory("AsterizmNonce");
    const Demo = await ethers.getContractFactory("AsterizmDemo");
    const [owner] = await ethers.getSigners();
    const currentChainIds = [1, 2];
    let chainIds = [];
    let chainTitles = [];
    for (let i = 0; i < currentChainIds.length; i++) {
      chainIds.push(currentChainIds[i]);
      chainTitles.push("Test chain " . i + 1);
    }

    const translator1 = await Transalor.deploy();
    await translator1.deployed();
    await translator1.addChains(chainIds, chainTitles);
    await translator1.setLocalChainId(currentChainIds[0]);
    // Translator1 Nonce deployment
    const outboundTranslator1Nonce = await Nonce.deploy();
    await outboundTranslator1Nonce.deployed();
    const inboundTranslator1Nonce = await Nonce.deploy();
    await inboundTranslator1Nonce.deployed();
    await translator1.setInBoundNonce(inboundTranslator1Nonce.address);
    await translator1.setOutBoundNonce(outboundTranslator1Nonce.address);
    await outboundTranslator1Nonce.setManipulator(translator1.address);
    await inboundTranslator1Nonce.setManipulator(translator1.address);

    const translator2 = await Transalor.deploy();
    await translator2.deployed();
    await translator2.addChains(chainIds, chainTitles);
    await translator2.setLocalChainId(currentChainIds[1]);
    // Translator2 Nonce deployment
    const outboundTranslator2Nonce = await Nonce.deploy();
    await outboundTranslator2Nonce.deployed();
    const inboundTranslator2Nonce = await Nonce.deploy();
    await inboundTranslator2Nonce.deployed();
    await translator2.setInBoundNonce(inboundTranslator2Nonce.address);
    await translator2.setOutBoundNonce(outboundTranslator2Nonce.address);
    await outboundTranslator2Nonce.setManipulator(translator2.address);
    await inboundTranslator2Nonce.setManipulator(translator2.address);

    // Initializer1 deployment
    const initializer1 = await Initializer.deploy(translator1.address);
    await initializer1.deployed();
    await initializer1.setIsDecSendAvailable(true);
    await initializer1.setIsEncSendAvailable(true);
    // Initializer Nonce deployment
    const outboundInitializer1Nonce = await Nonce.deploy();
    await outboundInitializer1Nonce.deployed();
    const inboundInitializer1Nonce = await Nonce.deploy();
    await inboundInitializer1Nonce.deployed();
    await initializer1.setInBoundNonce(inboundInitializer1Nonce.address);
    await initializer1.setOutBoundNonce(outboundInitializer1Nonce.address);
    await outboundInitializer1Nonce.setManipulator(initializer1.address);
    await inboundInitializer1Nonce.setManipulator(initializer1.address);

    // Initializer2 deployment
    const initializer2 = await Initializer.deploy(translator2.address);
    await initializer2.deployed();
    await initializer2.setIsDecSendAvailable(true);
    await initializer2.setIsEncSendAvailable(true);
    // Initializer Nonce deployment
    const outboundInitializer2Nonce = await Nonce.deploy();
    await outboundInitializer2Nonce.deployed();
    const inboundInitializer2Nonce = await Nonce.deploy();
    await inboundInitializer2Nonce.deployed();
    await initializer2.setInBoundNonce(inboundInitializer2Nonce.address);
    await initializer2.setOutBoundNonce(outboundInitializer2Nonce.address);
    await outboundInitializer2Nonce.setManipulator(initializer2.address);
    await inboundInitializer2Nonce.setManipulator(initializer2.address);

    await translator1.setEndpoint(initializer1.address);
    await translator2.setEndpoint(initializer2.address);

    const demo1 = await Demo.deploy(initializer1.address);
    await demo1.deployed();
    const demo2 = await Demo.deploy(initializer2.address);
    await demo2.deployed();

    await initializer1.addClient(demo1.address, false);
    await initializer2.addClient(demo2.address, false);

    // Fixtures can return anything you consider useful for your tests
    return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner, currentChainIds};
  }

  it("Should successfully deploy contracts", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner } = await loadFixture(deployContractsFixture);
  });

  it("Should successfully set endpoint for translator", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner } = await loadFixture(deployContractsFixture);
    expect(await translator1.endpoint()).to.equal(
        initializer1.address
    );
    expect(await translator2.endpoint()).to.equal(
        initializer2.address
    );
  });

  it("Should successfully add client address for initializer", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner } = await loadFixture(deployContractsFixture);
    let existsClient = await initializer1.clients(demo1.address);
    let notExistsClient = await initializer1.clients(owner.address);
    expect(existsClient.exists).to.equal(true);
    expect(existsClient.clientAddress).to.equal(demo1.address);
    expect(notExistsClient.exists).to.equal(false);
  });

  it("Should successfully send message", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message")).not.to.be.reverted;

  })

  it("Should emit any event from Translator", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message"))
      .to.emit(translator1, 'Packet')
  });

  it("Should send message from packet to Initializer", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(demo1.sendMessage(currentChainIds[0], demo1.address, "New message"))
        .to.emit(translator1, 'SuccessTransfer');
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message"))
        .to.emit(translator1, 'Packet')
        .withArgs(captureValue)
    await translator2.translateMessage(300000, capturedValue);
  });

  it("Should get exception for decode method not available on initializer", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await initializer1.setIsDecSendAvailable(false);
    expect(await initializer1.isDecSendAvailable()).to.equal(false);
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message"))
        .to.be.revertedWith("AsterizmInitializer: decode transfer is unavailable");
    await initializer1.setIsDecSendAvailable(true);
    expect(await initializer1.isDecSendAvailable()).to.equal(true);
  });

  it("Should get exception for encode method not available on initializer", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await demo1.setIsEncoded(true);
    expect(await demo1.isEncoded()).to.equal(true);
    await initializer1.setIsEncSendAvailable(false);
    expect(await initializer1.isEncSendAvailable()).to.equal(false);
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message"))
        .to.be.revertedWith("AsterizmInitializer: encode transfer is unavailable");
    await initializer1.setIsEncSendAvailable(true);
    expect(await initializer1.isEncSendAvailable()).to.equal(true);
    await demo1.setIsEncoded(false);
    expect(await demo1.isEncoded()).to.equal(false);
  });

  it("Should send message from packet to Initializer", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Demo, demo1, demo2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(demo1.sendMessage(currentChainIds[0], demo1.address, "New message"))
        .to.emit(translator1, 'SuccessTransfer');
    await expect(demo1.sendMessage(currentChainIds[1], demo1.address, "New message"))
      .to.emit(translator1, 'Packet')
      .withArgs(captureValue)
    const messageBefore = await demo1.externalChain();
    await translator2.translateMessage(300000, capturedValue);
    expect(await demo1.externalChain()).to.equal(messageBefore);
  });
});
