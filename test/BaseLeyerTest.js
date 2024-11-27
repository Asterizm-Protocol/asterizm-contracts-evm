const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

const CHAINLINK_TOKEN_TOTAL_SUPPLY = 1000000000000;
const CHAINLINK_TOKEN_DECIMALS = 6;
const CHAINLINK_BASE_FEE = 100000;

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

    const externalTranslator1 = await upgrades.deployProxy(Transalor, [currentChainIds[0], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await externalTranslator1.deployed();
    await externalTranslator1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
    await externalTranslator1.addRelayer(owner1.address);

    const externalTranslator2 = await upgrades.deployProxy(Transalor, [currentChainIds[1], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await externalTranslator2.deployed();
    await externalTranslator2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
    await externalTranslator2.addRelayer(owner1.address);


    const chainlinkToken1 = await ChainlinkToken.deploy(CHAINLINK_TOKEN_TOTAL_SUPPLY, CHAINLINK_TOKEN_DECIMALS);
    await chainlinkToken1.deployed();
    const chainlinkToken2 = await ChainlinkToken.deploy(CHAINLINK_TOKEN_TOTAL_SUPPLY, CHAINLINK_TOKEN_DECIMALS);
    await chainlinkToken2.deployed();

    const chainlinkRouter1 = await ChainlinkRouter.deploy(chainlinkToken1.address, CHAINLINK_BASE_FEE);
    await chainlinkRouter1.deployed();
    const chainlinkRouter2 = await ChainlinkRouter.deploy(chainlinkToken2.address, CHAINLINK_BASE_FEE);
    await chainlinkRouter2.deployed();

    const translatorChainlink1 = await TransalorChainlink.deploy(currentChainIds[0], chainTypes.EVM, chainSelectors[0], chainlinkRouter1.address, chainlinkToken1.address);
    await translatorChainlink1.deployed();
    await translatorChainlink1.addRelayer(owner1.address);

    const translatorChainlink2 = await TransalorChainlink.deploy(currentChainIds[1], chainTypes.EVM, chainSelectors[1], chainlinkRouter2.address, chainlinkToken2.address);
    await translatorChainlink2.deployed();
    await translatorChainlink2.addRelayer(owner1.address);

    await translatorChainlink1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM], chainSelectors);
    await translatorChainlink1.addChainRelays(currentChainIds, [translatorChainlink1.address, translatorChainlink2.address]);
    await translatorChainlink2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM], chainSelectors);
    await translatorChainlink2.addChainRelays(currentChainIds, [translatorChainlink1.address, translatorChainlink2.address]);


    // Initializer1 deployment
    const initializer1 = await upgrades.deployProxy(Initializer, [translator1.address], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await initializer1.deployed();
    await initializer1.manageTrustedRelay(externalTranslator1.address, externalFees[0], systemFees[0]);
    await initializer1.manageTrustedRelay(translatorChainlink1.address, 0, systemFees[0]);

    // Initializer2 deployment
    const initializer2 = await upgrades.deployProxy(Initializer, [translator2.address], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await initializer2.deployed();
    await initializer2.manageTrustedRelay(externalTranslator2.address, externalFees[1], systemFees[1]);
    await initializer2.manageTrustedRelay(translatorChainlink2.address, 0, systemFees[0]);

    await translator1.setInitializer(initializer1.address);
    await translator2.setInitializer(initializer2.address);
    await externalTranslator1.setInitializer(initializer1.address);
    await externalTranslator2.setInitializer(initializer2.address);
    await translatorChainlink1.setInitializer(initializer1.address);
    await translatorChainlink2.setInitializer(initializer2.address);

    const demo1 = await Demo.deploy(initializer1.address);
    await demo1.deployed();
    const demo2 = await Demo.deploy(initializer2.address);
    await demo2.deployed();
    await demo1.addTrustedAddresses(currentChainIds, [demo1.address, demo2.address]);
    await demo2.addTrustedAddresses(currentChainIds, [demo1.address, demo2.address]);


    const chainlinkDemo1 = await Demo.deploy(initializer1.address);
    await chainlinkDemo1.deployed();
    const chainlinkDemo2 = await Demo.deploy(initializer2.address);
    await chainlinkDemo2.deployed();
    await chainlinkDemo1.addTrustedAddresses(currentChainIds, [chainlinkDemo1.address, chainlinkDemo2.address]);
    await chainlinkDemo2.addTrustedAddresses(currentChainIds, [chainlinkDemo1.address, chainlinkDemo2.address]);
    await chainlinkDemo1.setExternalRelay(translatorChainlink1.address);
    await chainlinkDemo2.setExternalRelay(translatorChainlink2.address);
    await chainlinkDemo1.setFeeToken(chainlinkToken1.address);
    await chainlinkDemo2.setFeeToken(chainlinkToken2.address);

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
    expect(dstAddress).to.equal(demo2.address);
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
    expect(dstAddress).to.equal(demo1.address);
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
    expect(dstAddress).to.equal(demo2.address);
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
    expect(dstAddress).to.equal(demo1.address);
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
    expect(dstAddress).to.equal(demo2.address);
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
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.be.revertedWithCustomError(initializer1, 'CustomError')
        .withArgs(3007);

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
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.be.revertedWithCustomError(initializer1, 'CustomError')
        .withArgs(3006);

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
    expect(dstAddress).to.equal(demo2.address);
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
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(demo1.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(demo2.address); // dstAddress
    expect(feeValue).to.equal(feeAmount); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(demo1.address)).to.equal(0);
    expect(await provider.getBalance(translator1.address)).to.equal(0);
    expect(await provider.getBalance(owner2.address)).to.equal(owner2BalanceBefore.add(feeAmount));
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
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(demo1.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(demo2.address); // dstAddress
    expect(feeValue).to.equal(feeAmount); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(demo1.address)).to.equal(0);
    expect(await provider.getBalance(translator1.address)).to.equal(0);
    expect(await provider.getBalance(owner2.address)).to.equal(owner2BalanceBefore.add(feeAmount));

    let resendFeeAmount = ethers.utils.parseEther("1");

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
    expect(resendResultSender).to.equal(demo1.address);
    expect(resendResultAmount).to.equal(resendFeeAmount);

    resendFeeAmount = ethers.utils.parseEther("2");
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
    const feeAmount = ethers.utils.parseEther("1");
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
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(demo1.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(demo2.address); // dstAddress
    expect(feeValue).to.equal(feeAmount); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(demo1.address)).to.equal(0);
    expect(await provider.getBalance(translator1.address)).to.equal(0);
    await expect(translator2.transferMessage(300000, capturedValue))
        .to.emit(demo2, 'PayloadReceivedEvent');
    let payloadValue = ethers.utils.defaultAbiCoder.decode(['string'], payload.toString());
    expect(payloadValue[0]).to.equal(newMessage);
    await expect(demo2.asterizmClReceive(currentChainIds[0], demo1.address, decodedValue[4], decodedValue[6], payload)).to.not.reverted;
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
    await expect(demo1.setExternalRelay(externalTranslator1.address)).to.not.reverted;
    await expect(demo1.setExternalRelay(externalTranslator1.address))
        .to.be.revertedWithCustomError(demo1, 'CustomError')
        .withArgs(4010);
    const newMessage = "New message with external relays logic";
    const provider = ethers.provider;
    const feeAmount = ethers.utils.parseEther("1");
    const feeAmountWithoutSystemFee = feeAmount.sub(systemFees[0]);
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
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(externalTranslator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(demo1.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(demo2.address); // dstAddress
    expect(feeValue).to.equal(feeAmountWithoutSystemFee); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(demo1.address)).to.equal(0);
    expect(await provider.getBalance(externalTranslator1.address)).to.equal(0);
    await expect(externalTranslator2.transferMessage(300000, capturedValue))
        .to.emit(demo2, 'PayloadReceivedEvent');
    let payloadValue = ethers.utils.defaultAbiCoder.decode(['string'], payload.toString());
    expect(payloadValue[0]).to.equal(newMessage);
    await expect(demo2.asterizmClReceive(currentChainIds[0], demo1.address, decodedValue[4], decodedValue[6], payload)).to.not.reverted;
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
    await expect(demo1.setExternalRelay(externalTranslator1.address)).to.not.reverted;
    await expect(demo1.setExternalRelay(externalTranslator1.address))
        .to.be.revertedWithCustomError(demo1, 'CustomError')
        .withArgs(4010);
    const newMessage = "New message with external relays logic and updated fees";
    const provider = ethers.provider;
    const feeAmount = ethers.utils.parseEther("1");
    const newRelayFee = 10;
    const newSystemFee = 100;
    let manageInitAddress, manageRelayAddress, manageFee, manageSystemFee;
    await expect(initializer1.manageTrustedRelay(externalTranslator1.address, externalFees[0], newSystemFee))
        .to.emit(initializer1, 'TrustedRelayEvent')
        .withArgs(
            (value) => {manageInitAddress = value; return true;},
            (value) => {manageRelayAddress = value; return true;},
            (value) => {manageFee = value; return true;},
            (value) => {manageSystemFee = value; return true;},
        );
    expect(manageInitAddress).to.equal(owner1.address);
    expect(manageRelayAddress).to.equal(externalTranslator1.address);
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
    expect(manageInitAddress).to.equal(externalTranslator1.address);
    expect(manageRelayAddress).to.equal(externalTranslator1.address);
    expect(manageFee).to.equal(newRelayFee);
    expect(manageSystemFee).to.equal(newSystemFee);
    const feeAmountWithoutSystemFee = feeAmount.sub(newSystemFee);
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
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(externalTranslator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(demo1.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(demo2.address); // dstAddress
    expect(feeValue).to.equal(feeAmountWithoutSystemFee); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(demo1.address)).to.equal(0);
    expect(await provider.getBalance(externalTranslator1.address)).to.equal(0);
    await expect(externalTranslator2.transferMessage(300000, capturedValue))
        .to.emit(demo2, 'PayloadReceivedEvent');
    let payloadValue = ethers.utils.defaultAbiCoder.decode(['string'], payload.toString());
    expect(payloadValue[0]).to.equal(newMessage);
    await expect(demo2.asterizmClReceive(currentChainIds[0], demo1.address, decodedValue[4], decodedValue[6], payload)).to.not.reverted;
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
    const feeAmount = ethers.utils.parseEther("1");
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
    expect(dstAddress).to.equal(demo2.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(demo1.initAsterizmTransfer(dstChainId, txId, transferHash, {value: feeAmount}))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(demo1.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(demo2.address); // dstAddress
    expect(feeValue).to.equal(feeAmount); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await provider.getBalance(demo1.address)).to.equal(0);
    expect(await provider.getBalance(translator1.address)).to.equal(0);
    await expect(translator2.transferMessage(300000, capturedValue))
        .to.emit(demo2, 'PayloadReceivedEvent');
    let payloadValue = ethers.utils.defaultAbiCoder.decode(['string'], payload.toString());
    expect(payloadValue[0]).to.equal(newMessage);

    const statusCode = 0;
    let notifyTransferHash, notifyStatusCode;
    await expect(translator1.transferSendingResultNotification(demo1.address, transferHash, statusCode))
        .to.emit(demo1, 'TransferSendingResultNotification')
        .withArgs(
            (value) => {notifyTransferHash = value; return true;},
            (value) => {notifyStatusCode = value; return true;},
        );
    expect(notifyTransferHash).to.equal(transferHash);
    expect(notifyStatusCode).to.equal(statusCode);

    await expect(demo2.asterizmClReceive(currentChainIds[0], demo1.address, decodedValue[4], decodedValue[6], payload)).to.not.reverted;
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
    const feeAmount = ethers.utils.parseEther("1");
    const feeTokenAmount = 1000000000;
    const baseTokenFeeAmount = 100000;
    await chainlinkToken1.transfer(translatorChainlink1.address, feeTokenAmount);
    await chainlinkToken1.transfer(chainlinkDemo1.address, feeTokenAmount);
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
    expect(dstAddress).to.equal(chainlinkDemo2.address);
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
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(chainlinkDemo1.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(chainlinkDemo2.address); // dstAddress
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash

    expect(await chainlinkToken1.balanceOf(chainlinkDemo1.address)).to.equal((feeTokenAmount - baseTokenFeeAmount).toString());
    expect(await chainlinkToken1.balanceOf(chainlinkRouter1.address)).to.equal(baseTokenFeeAmount.toString());

    let chainlinkSrcChainId, chainlinkSrcAddress, chainlinkTsId, chainlinkTransferhash;
    await expect(chainlinkRouter2.routeMessage(
        {
          messageId: chainlinkMessageId,
          sourceChainSelector: chainSelectors[0],
          sender: translatorChainlink1.address,
          data: capturedValue,
          destTokenAmounts: [{token: chainlinkToken1.address, amount: 100000}]
        },
        100,
        30000000,
        translatorChainlink2.address,
        {gasLimit: 30000000}
    )).to.emit(chainlinkDemo2, 'PayloadReceivedEvent')
        .withArgs(
            (value) => {chainlinkSrcChainId = value; return true;},
            (value) => {chainlinkSrcAddress = value; return true;},
            (value) => {chainlinkTsId = value; return true;},
            (value) => {chainlinkTransferhash = value; return true;},
        );
    expect(chainlinkSrcChainId).to.equal(currentChainIds[0]);
    expect(chainlinkSrcAddress).to.equal(chainlinkDemo1.address);
    expect(chainlinkTsId).to.equal(decodedValue[4]);
    expect(chainlinkTransferhash).to.equal(decodedValue[6]);
    let payloadValue = ethers.utils.defaultAbiCoder.decode(['string'], payload.toString());
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
    expect(await owner1.sendTransaction({ to: translator1.address, value: coinAmount })).not.to.be.reverted;
    expect(await owner1.sendTransaction({ to: initializer1.address, value: coinAmount })).not.to.be.reverted;
    expect(await owner1.sendTransaction({ to: demo1.address, value: coinAmount })).not.to.be.reverted;
    await chainlinkToken1.transfer(translator1.address, tokenAmount);
    await chainlinkToken1.transfer(initializer1.address, tokenAmount);
    await chainlinkToken1.transfer(demo1.address, tokenAmount);
    expect(await provider.getBalance(translator1.address)).to.equal(coinAmount);
    expect(await provider.getBalance(initializer1.address)).to.equal(coinAmount);
    expect(await provider.getBalance(demo1.address)).to.equal(coinAmount);
    expect(await chainlinkToken1.balanceOf(translator1.address)).to.equal(tokenAmount);
    expect(await chainlinkToken1.balanceOf(initializer1.address)).to.equal(tokenAmount);
    expect(await chainlinkToken1.balanceOf(demo1.address)).to.equal(tokenAmount);
    expect(await translator1.withdrawCoins(owner1.address, withdrawCoinAmount)).not.to.be.reverted;
    expect(await provider.getBalance(translator1.address)).to.equal(coinAmount - withdrawCoinAmount);
    expect(await initializer1.withdrawCoins(owner1.address, withdrawCoinAmount)).not.to.be.reverted;
    expect(await provider.getBalance(initializer1.address)).to.equal(coinAmount - withdrawCoinAmount);
    expect(await demo1.withdrawCoins(owner1.address, withdrawCoinAmount)).not.to.be.reverted;
    expect(await provider.getBalance(demo1.address)).to.equal(coinAmount - withdrawCoinAmount);
    expect(await translator1.withdrawTokens(chainlinkToken1.address, owner1.address, withdrawTokenAmount)).not.to.be.reverted;
    expect(await chainlinkToken1.balanceOf(translator1.address)).to.equal(tokenAmount - withdrawTokenAmount);
    expect(await initializer1.withdrawTokens(chainlinkToken1.address, owner1.address, withdrawTokenAmount)).not.to.be.reverted;
    expect(await chainlinkToken1.balanceOf(initializer1.address)).to.equal(tokenAmount - withdrawTokenAmount);
    expect(await demo1.withdrawTokens(chainlinkToken1.address, owner1.address, withdrawTokenAmount)).not.to.be.reverted;
    expect(await chainlinkToken1.balanceOf(demo1.address)).to.equal(tokenAmount - withdrawTokenAmount);
  });
});
