const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const bigInt = require("big-integer");

const CHAINLINK_TOKEN_TOTAL_SUPPLY = 1000000000000;
const CHAINLINK_TOKEN_DECIMALS = 6;
const CHAINLINK_BASE_FEE = 100000;

const pow = bigInt(10).pow(18);
describe("Base layer test", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
    const Demo = await ethers.getContractFactory("AsterizmDemo");
    const TransalorChainlink = await ethers.getContractFactory("AsterizmTranslatorChainlink");
    const ChainlinkRouter = await ethers.getContractFactory("ChainlinkTestRouter");
    const ChainlinkToken = await ethers.getContractFactory("ChainlinkTestToken");

    const [owner1, owner2] = await ethers.getSigners();
    const currentChainIds = [1, 2];
    const externalFees = [1, 1];
    const systemFees = [2, 2];
    const chainTypes = {EVM: 1, TVM: 2};
    const chainSelectors = ['16015286601757825753', '12532609583862916517'];

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

    const externalTranslator1 = await upgrades.deployProxy(Transalor, [currentChainIds[0], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await externalTranslator1.waitForDeployment();
    await externalTranslator1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
    await externalTranslator1.addRelayer(owner1.address);

    const externalTranslator2 = await upgrades.deployProxy(Transalor, [currentChainIds[1], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await externalTranslator2.waitForDeployment();
    await externalTranslator2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
    await externalTranslator2.addRelayer(owner1.address);


    const chainlinkToken1 = await ChainlinkToken.deploy(CHAINLINK_TOKEN_TOTAL_SUPPLY, CHAINLINK_TOKEN_DECIMALS);
    await chainlinkToken1.waitForDeployment();
    const chainlinkToken2 = await ChainlinkToken.deploy(CHAINLINK_TOKEN_TOTAL_SUPPLY, CHAINLINK_TOKEN_DECIMALS);
    await chainlinkToken2.waitForDeployment();

    const chainlinkRouter1 = await ChainlinkRouter.deploy(await chainlinkToken1.getAddress(), CHAINLINK_BASE_FEE);
    await chainlinkRouter1.waitForDeployment();
    const chainlinkRouter2 = await ChainlinkRouter.deploy(await chainlinkToken2.getAddress(), CHAINLINK_BASE_FEE);
    await chainlinkRouter2.waitForDeployment();

    const translatorChainlink1 = await TransalorChainlink.deploy(currentChainIds[0], chainTypes.EVM, chainSelectors[0], await chainlinkRouter1.getAddress(), await chainlinkToken1.getAddress());
    await translatorChainlink1.waitForDeployment();
    await translatorChainlink1.addRelayer(owner1.address);

    const translatorChainlink2 = await TransalorChainlink.deploy(currentChainIds[1], chainTypes.EVM, chainSelectors[1], await chainlinkRouter2.getAddress(), await chainlinkToken2.getAddress());
    await translatorChainlink2.waitForDeployment();
    await translatorChainlink2.addRelayer(owner1.address);

    await translatorChainlink1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM], chainSelectors);
    await translatorChainlink1.addChainRelays(currentChainIds, [await translatorChainlink1.getAddress(), await translatorChainlink2.getAddress()]);
    await translatorChainlink2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM], chainSelectors);
    await translatorChainlink2.addChainRelays(currentChainIds, [await translatorChainlink1.getAddress(), await translatorChainlink2.getAddress()]);


    // Initializer1 deployment
    const initializer1 = await upgrades.deployProxy(Initializer, [await translator1.getAddress()], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await initializer1.waitForDeployment();
    await initializer1.manageTrustedRelay(await externalTranslator1.getAddress(), externalFees[0], systemFees[0]);
    await initializer1.manageTrustedRelay(await translatorChainlink1.getAddress(), 0, systemFees[0]);

    // Initializer2 deployment
    const initializer2 = await upgrades.deployProxy(Initializer, [await translator2.getAddress()], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await initializer2.waitForDeployment();
    await initializer2.manageTrustedRelay(await externalTranslator2.getAddress(), externalFees[1], systemFees[1]);
    await initializer2.manageTrustedRelay(await translatorChainlink2.getAddress(), 0, systemFees[0]);

    await translator1.setInitializer(await initializer1.getAddress());
    await translator2.setInitializer(await initializer2.getAddress());
    await externalTranslator1.setInitializer(await initializer1.getAddress());
    await externalTranslator2.setInitializer(await initializer2.getAddress());
    await translatorChainlink1.setInitializer(await initializer1.getAddress());
    await translatorChainlink2.setInitializer(await initializer2.getAddress());

    const demo1 = await Demo.deploy(await initializer1.getAddress());
    await demo1.waitForDeployment();
    const demo2 = await Demo.deploy(await initializer2.getAddress());
    await demo2.waitForDeployment();
    await demo1.addTrustedAddresses(currentChainIds, [await demo1.getAddress(), await demo2.getAddress()]);
    await demo2.addTrustedAddresses(currentChainIds, [await demo1.getAddress(), await demo2.getAddress()]);


    const chainlinkDemo1 = await Demo.deploy(await initializer1.getAddress());
    await chainlinkDemo1.waitForDeployment();
    const chainlinkDemo2 = await Demo.deploy(await initializer2.getAddress());
    await chainlinkDemo2.waitForDeployment();
    await chainlinkDemo1.addTrustedAddresses(currentChainIds, [await chainlinkDemo1.getAddress(), await chainlinkDemo2.getAddress()]);
    await chainlinkDemo2.addTrustedAddresses(currentChainIds, [await chainlinkDemo1.getAddress(), await chainlinkDemo2.getAddress()]);
    await chainlinkDemo1.setExternalRelay(await translatorChainlink1.getAddress());
    await chainlinkDemo2.setExternalRelay(await translatorChainlink2.getAddress());
    await chainlinkDemo1.setFeeToken(await chainlinkToken1.getAddress());
    await chainlinkDemo2.setFeeToken(await chainlinkToken2.getAddress());

    // Fixtures can return anything you consider useful for your tests
    return {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    };
  }

  it("Should successfully deploy contracts", async function () {
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
  });

  it("Should successfully send message", async function () {
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, owner1, owner2, currentChainIds, externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
    await expect(demo1.sendMessage(currentChainIds[1], "New message")).not.to.be.reverted;
  })

  it("Should emit any event from Translator", async function () {
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
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
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    let PacketValue;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
  });

  it("Should send message from packet to Initializer", async function () {
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
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
    expect(dstAddress).to.equal(await demo1.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
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
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    let PacketValue;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    await translator2.transferMessage(300000, PacketValue);
  });

  it("Should send message from packet to Initializer", async function () {
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
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
    expect(dstAddress).to.equal(await demo1.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
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
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    let PacketValue;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    await translator2.transferMessage(300000, PacketValue);
  });

  it("Should not sent from/to blocked address, then success send message", async function () {
    let PacketValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);

    await expect(initializer1.addBlockAddress(currentChainIds[1], await demo2.getAddress()))
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
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.be.revertedWithCustomError(initializer1, 'CustomError')
        .withArgs(3007);

    await expect(initializer1.addBlockAddress(currentChainIds[0], await demo1.getAddress()))
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
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.be.revertedWithCustomError(initializer1, 'CustomError')
        .withArgs(3006);

    await expect(initializer1.removeBlockAddress(currentChainIds[0], await demo1.getAddress()))
        .to.emit(initializer1, 'RemoveBlockAddressEvent');
    await expect(initializer1.removeBlockAddress(currentChainIds[1], await demo2.getAddress()))
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
    expect(dstAddress).to.equal(await demo1.getAddress());
    expect(txId).to.equal(2);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
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
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(3);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
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
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
    const provider = ethers.provider;
    const feeAmount = bigInt(1).multiply(pow.toString()).toString();
    await translator1.transferOwnership(owner2.address);
    const owner2BalanceBefore = bigInt(await provider.getBalance(owner2.address));
    expect(await provider.getBalance(await demo1.getAddress())).to.equal(0);
    expect(await provider.getBalance(await translator1.getAddress())).to.equal(0);
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
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await demo1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await demo2.getAddress()); // dstAddress
    expect(feeValue).to.equal(feeAmount); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(await demo1.getAddress())).to.equal(0);
    expect(await provider.getBalance(await translator1.getAddress())).to.equal(0);
    expect(await provider.getBalance(owner2.address)).to.equal(owner2BalanceBefore.add(feeAmount).toString());
  });

  it("Should resend message from client and initializer contracts", async function () {
    let PacketValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
    const provider = ethers.provider;
    const feeAmount = bigInt(1).multiply(pow.toString()).toString();
    await translator1.transferOwnership(owner2.address);
    const owner2BalanceBefore = bigInt(await provider.getBalance(owner2.address));
    expect(await provider.getBalance(await demo1.getAddress())).to.equal(0);
    expect(await provider.getBalance(await translator1.getAddress())).to.equal(0);
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
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await demo1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await demo2.getAddress()); // dstAddress
    expect(feeValue).to.equal(feeAmount); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(await demo1.getAddress())).to.equal(0);
    expect(await provider.getBalance(await translator1.getAddress())).to.equal(0);
    expect(await provider.getBalance(owner2.address)).to.equal(owner2BalanceBefore.add(feeAmount).toString());

    let resendFeeAmount = bigInt(1).multiply(pow.toString()).toString();

    const wrongTransferHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
    await expect(demo1.resendAsterizmTransfer(wrongTransferHash, {value: resendFeeAmount}))
        .to.be.revertedWithCustomError(demo1, 'CustomError')
        .withArgs(4007);
    await expect(initializer1.resendTransfer(wrongTransferHash, '0x0000000000000000000000000000000000000000', {value: resendFeeAmount}))
        .to.be.revertedWithCustomError(initializer1, 'CustomError')
        .withArgs(3003);

    let resendResultHash, resendResultSender, resendResultAmount;
    await expect(demo1.resendAsterizmTransfer(transferHash, {value: resendFeeAmount}))
        .to.emit(translator1, 'ResendFailedTransferEvent')
        .withArgs(
            (value) => {resendResultHash = value; return true;},
            (value) => {resendResultSender = value; return true;},
            (value) => {resendResultAmount = value; return true;},
        );
    expect(resendResultHash).to.equal(transferHash);
    expect(resendResultSender).to.equal(await demo1.getAddress());
    expect(resendResultAmount).to.equal(resendFeeAmount);

    resendFeeAmount = bigInt(2).multiply(pow.toString()).toString();
    await expect(initializer1.resendTransfer(transferHash, '0x0000000000000000000000000000000000000000', {value: resendFeeAmount}))
        .to.emit(translator1, 'ResendFailedTransferEvent')
        .withArgs(
            (value) => {resendResultHash = value; return true;},
            (value) => {resendResultSender = value; return true;},
            (value) => {resendResultAmount = value; return true;},
        );
    expect(resendResultHash).to.equal(transferHash);
    expect(resendResultSender).to.equal(owner1.address);
    expect(resendResultAmount).to.equal(resendFeeAmount);
  });

  it("Should transfer fully completed", async function () {
    let PacketValue, capturedValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
    const newMessage = "New message";
    const provider = ethers.provider;
    const feeAmount = bigInt(1).multiply(pow.toString()).toString();
    await expect(demo1.sendMessage(currentChainIds[1], newMessage))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await demo1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await demo2.getAddress()); // dstAddress
    expect(feeValue).to.equal(feeAmount); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(await demo1.getAddress())).to.equal(0);
    expect(await provider.getBalance(await translator1.getAddress())).to.equal(0);
    await expect(translator2.transferMessage(300000, capturedValue))
        .to.emit(demo2, 'PayloadReceivedEvent');
    let payloadValue = ethers.AbiCoder.defaultAbiCoder().decode(['string'], payload.toString());
    expect(payloadValue[0]).to.equal(newMessage);
    await expect(demo2.asterizmClReceive(currentChainIds[0], await demo1.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
    expect(await demo2.externalChainMessage()).to.equal(newMessage);
  });

  it("Should transfer fully completed with external relays logic", async function () {
    let PacketValue, capturedValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
    await expect(demo1.setExternalRelay(await externalTranslator1.getAddress())).to.not.reverted;
    await expect(demo1.setExternalRelay(await externalTranslator1.getAddress()))
        .to.be.revertedWithCustomError(demo1, 'CustomError')
        .withArgs(4010);
    const newMessage = "New message with external relays logic";
    const provider = ethers.provider;
    const feeAmount = bigInt(1).multiply(pow.toString());
    const feeAmountWithoutSystemFee = feeAmount.subtract(systemFees[0]);
    await expect(demo1.sendMessage(currentChainIds[1], newMessage))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount.toString()}))
        .to.emit(externalTranslator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await demo1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await demo2.getAddress()); // dstAddress
    expect(feeValue.toString()).to.equal(feeAmountWithoutSystemFee.toString()); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(await demo1.getAddress())).to.equal(0);
    expect(await provider.getBalance(await externalTranslator1.getAddress())).to.equal(0);
    await expect(externalTranslator2.transferMessage(300000, capturedValue))
        .to.emit(demo2, 'PayloadReceivedEvent');
    let payloadValue = ethers.AbiCoder.defaultAbiCoder().decode(['string'], payload.toString());
    expect(payloadValue[0]).to.equal(newMessage);
    await expect(demo2.asterizmClReceive(currentChainIds[0], await demo1.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
    expect(await demo2.externalChainMessage()).to.equal(newMessage);
  });

  it("Should transfer fully completed with external relays logic and updated fees", async function () {
    let PacketValue, capturedValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
    await expect(demo1.setExternalRelay(await externalTranslator1.getAddress())).to.not.reverted;
    await expect(demo1.setExternalRelay(await externalTranslator1.getAddress()))
        .to.be.revertedWithCustomError(demo1, 'CustomError')
        .withArgs(4010);
    const newMessage = "New message with external relays logic and updated fees";
    const provider = ethers.provider;
    const feeAmount = bigInt(1).multiply(pow.toString());
    const newRelayFee = 10;
    const newSystemFee = 100;
    let manageInitAddress, manageRelayAddress, manageFee, manageSystemFee;
    await expect(initializer1.manageTrustedRelay(await externalTranslator1.getAddress(), externalFees[0], newSystemFee))
        .to.emit(initializer1, 'TrustedRelayEvent')
        .withArgs(
            (value) => {manageInitAddress = value; return true;},
            (value) => {manageRelayAddress = value; return true;},
            (value) => {manageFee = value; return true;},
            (value) => {manageSystemFee = value; return true;},
        );
    expect(manageInitAddress).to.equal(owner1.address);
    expect(manageRelayAddress).to.equal(await externalTranslator1.getAddress());
    expect(manageFee).to.equal(externalFees[0]);
    expect(manageSystemFee).to.equal(newSystemFee);

    await expect(externalTranslator1.updateTrustedRelayFee(newRelayFee))
        .to.emit(initializer1, 'TrustedRelayEvent')
        .withArgs(
            (value) => {manageInitAddress = value; return true;},
            (value) => {manageRelayAddress = value; return true;},
            (value) => {manageFee = value; return true;},
            (value) => {manageSystemFee = value; return true;},
        );
    expect(manageInitAddress).to.equal(await externalTranslator1.getAddress());
    expect(manageRelayAddress).to.equal(await externalTranslator1.getAddress());
    expect(manageFee).to.equal(newRelayFee);
    expect(manageSystemFee).to.equal(newSystemFee);
    const feeAmountWithoutSystemFee = feeAmount.subtract(newSystemFee);
    await expect(demo1.sendMessage(currentChainIds[1], newMessage))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount.toString()}))
        .to.emit(externalTranslator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await demo1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await demo2.getAddress()); // dstAddress
    expect(feeValue).to.equal(feeAmountWithoutSystemFee.toString()); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(await demo1.getAddress())).to.equal(0);
    expect(await provider.getBalance(await externalTranslator1.getAddress())).to.equal(0);
    await expect(externalTranslator2.transferMessage(300000, capturedValue))
        .to.emit(demo2, 'PayloadReceivedEvent');
    let payloadValue = ethers.AbiCoder.defaultAbiCoder().decode(['string'], payload.toString());
    expect(payloadValue[0]).to.equal(newMessage);
    await expect(demo2.asterizmClReceive(currentChainIds[0], await demo1.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
    expect(await demo2.externalChainMessage()).to.equal(newMessage);
  });

  it("Should transfer fully completed and emit TransferSendingResultNotification event", async function () {
    let PacketValue, capturedValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
    const newMessage = "New message";
    const provider = ethers.provider;
    const feeAmount = bigInt(1).multiply(pow.toString()).toString();
    await expect(demo1.sendMessage(currentChainIds[1], newMessage))
        .to.emit(demo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await demo2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await demo1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await demo2.getAddress()); // dstAddress
    expect(feeValue).to.equal(feeAmount); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(await demo1.getAddress())).to.equal(0);
    expect(await provider.getBalance(await translator1.getAddress())).to.equal(0);
    await expect(translator2.transferMessage(300000, capturedValue))
        .to.emit(demo2, 'PayloadReceivedEvent');
    let payloadValue = ethers.AbiCoder.defaultAbiCoder().decode(['string'], payload.toString());
    expect(payloadValue[0]).to.equal(newMessage);

    const statusCode = 0;
    let notifyTransferHash, notifyStatusCode;
    await expect(translator1.transferSendingResultNotification(await demo1.getAddress(), transferHash, statusCode))
        .to.emit(demo1, 'TransferSendingResultNotification')
        .withArgs(
            (value) => {notifyTransferHash = value; return true;},
            (value) => {notifyStatusCode = value; return true;},
        );
    expect(notifyTransferHash).to.equal(transferHash);
    expect(notifyStatusCode).to.equal(statusCode);

    await expect(demo2.asterizmClReceive(currentChainIds[0], await demo1.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
    expect(await demo2.externalChainMessage()).to.equal(newMessage);
  });

  it("Should transfer fully completed throw chainlink router", async function () {
    let PacketValue, capturedValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
    const newMessage = "New message";
    const provider = ethers.provider;
    const feeAmount = bigInt(1).multiply(pow.toString()).toString();
    const feeTokenAmount = 1000000000;
    const baseTokenFeeAmount = 100000;
    await chainlinkToken1.transfer(await translatorChainlink1.getAddress(), feeTokenAmount);
    await chainlinkToken1.transfer(await chainlinkDemo1.getAddress(), feeTokenAmount);
    await expect(chainlinkDemo1.sendMessage(currentChainIds[1], newMessage))
        .to.emit(chainlinkDemo1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await chainlinkDemo2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    let chainlinkTransferHash, chainlinkMessageId;
    await expect(chainlinkDemo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(translatorChainlink1, 'SendMessageEvent')
        .withArgs(
            (value) => {chainlinkTransferHash = value; return true;},
            (value) => {chainlinkMessageId = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    expect(chainlinkTransferHash).to.equal(transferHash);
    expect(chainlinkMessageId).to.not.null;
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await chainlinkDemo1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await chainlinkDemo2.getAddress()); // dstAddress
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash

    expect(await chainlinkToken1.balanceOf(await chainlinkDemo1.getAddress())).to.equal((feeTokenAmount - baseTokenFeeAmount).toString());
    expect(await chainlinkToken1.balanceOf(await chainlinkRouter1.getAddress())).to.equal(baseTokenFeeAmount.toString());

    let chainlinkSrcChainId, chainlinkSrcAddress, chainlinkTsId, chainlinkTransferhash;
    await expect(chainlinkRouter2.routeMessage(
        {
          messageId: chainlinkMessageId,
          sourceChainSelector: chainSelectors[0],
          sender: await translatorChainlink1.getAddress(),
          data: capturedValue,
          destTokenAmounts: [{token: await chainlinkToken1.getAddress(), amount: 100000}]
        },
        100,
        30000000,
        await translatorChainlink2.getAddress(),
        {gasLimit: 30000000}
    )).to.emit(chainlinkDemo2, 'PayloadReceivedEvent')
        .withArgs(
            (value) => {chainlinkSrcChainId = value; return true;},
            (value) => {chainlinkSrcAddress = value; return true;},
            (value) => {chainlinkTsId = value; return true;},
            (value) => {chainlinkTransferhash = value; return true;},
        );
    expect(chainlinkSrcChainId).to.equal(currentChainIds[0]);
    expect(chainlinkSrcAddress).to.equal(await chainlinkDemo1.getAddress());
    expect(chainlinkTsId).to.equal(decodedValue[4]);
    expect(chainlinkTransferhash).to.equal(decodedValue[6]);
    let payloadValue = ethers.AbiCoder.defaultAbiCoder().decode(['string'], payload.toString());
    expect(payloadValue[0]).to.equal(newMessage);
  });

  it("Should withdraw successfully from all base contracts", async function () {
    let PacketValue, capturedValue, feeValue, dstChainId, dstAddress, txId, transferHash, payload;
    const {
      Initializer, initializer1, initializer2, Transalor, translator1, translator2,
      externalTranslator1, externalTranslator2, translatorChainlink1, translatorChainlink2,
      ChainlinkToken, chainlinkToken1, chainlinkToken2, ChainlinkRouter, chainlinkRouter1, chainlinkRouter2,
      Demo, demo1, demo2, chainlinkDemo1, chainlinkDemo2, owner1, owner2, currentChainIds,
      externalFees, systemFees, chainSelectors
    } = await loadFixture(deployContractsFixture);
    const provider = ethers.provider;
      const coinAmount = 1000;
      const tokenAmount = 1000;
      const withdrawCoinAmount = 500;
      const withdrawTokenAmount = 500;
    expect(await owner1.sendTransaction({ to: await translator1.getAddress(), value: coinAmount })).not.to.be.reverted;
    expect(await owner1.sendTransaction({ to: await initializer1.getAddress(), value: coinAmount })).not.to.be.reverted;
    expect(await owner1.sendTransaction({ to: await demo1.getAddress(), value: coinAmount })).not.to.be.reverted;
    await chainlinkToken1.transfer(await translator1.getAddress(), tokenAmount);
    await chainlinkToken1.transfer(await initializer1.getAddress(), tokenAmount);
    await chainlinkToken1.transfer(await demo1.getAddress(), tokenAmount);
    expect(await provider.getBalance(await translator1.getAddress())).to.equal(coinAmount);
    expect(await provider.getBalance(await initializer1.getAddress())).to.equal(coinAmount);
    expect(await provider.getBalance(await demo1.getAddress())).to.equal(coinAmount);
    expect(await chainlinkToken1.balanceOf(await translator1.getAddress())).to.equal(tokenAmount);
    expect(await chainlinkToken1.balanceOf(await initializer1.getAddress())).to.equal(tokenAmount);
    expect(await chainlinkToken1.balanceOf(await demo1.getAddress())).to.equal(tokenAmount);
    expect(await translator1.withdrawCoins(owner1.address, withdrawCoinAmount)).not.to.be.reverted;
    expect(await provider.getBalance(await translator1.getAddress())).to.equal(coinAmount - withdrawCoinAmount);
    expect(await initializer1.withdrawCoins(owner1.address, withdrawCoinAmount)).not.to.be.reverted;
    expect(await provider.getBalance(await initializer1.getAddress())).to.equal(coinAmount - withdrawCoinAmount);
    expect(await demo1.withdrawCoins(owner1.address, withdrawCoinAmount)).not.to.be.reverted;
    expect(await provider.getBalance(await demo1.getAddress())).to.equal(coinAmount - withdrawCoinAmount);
    expect(await translator1.withdrawTokens(await chainlinkToken1.getAddress(), owner1.address, withdrawTokenAmount)).not.to.be.reverted;
    expect(await chainlinkToken1.balanceOf(await translator1.getAddress())).to.equal(tokenAmount - withdrawTokenAmount);
    expect(await initializer1.withdrawTokens(await chainlinkToken1.getAddress(), owner1.address, withdrawTokenAmount)).not.to.be.reverted;
    expect(await chainlinkToken1.balanceOf(await initializer1.getAddress())).to.equal(tokenAmount - withdrawTokenAmount);
    expect(await demo1.withdrawTokens(await chainlinkToken1.getAddress(), owner1.address, withdrawTokenAmount)).not.to.be.reverted;
    expect(await chainlinkToken1.balanceOf(await demo1.getAddress())).to.equal(tokenAmount - withdrawTokenAmount);
  });
});
