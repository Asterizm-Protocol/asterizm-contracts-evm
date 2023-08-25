const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const {BigNumber} = require("ethers");

let pow = BigNumber.from(10).pow(18);
const TOKEN_AMOUNT = BigNumber.from(1000000).mul(pow);

describe("Crosschain token", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV2");
    const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
    const Token = await ethers.getContractFactory("MultichainToken");
    const Nonce = await ethers.getContractFactory("AsterizmNonce");
    const Gas = await ethers.getContractFactory("GasStationUpgradeableV1");
    const [owner] = await ethers.getSigners();
    const currentChainIds = [1, 2];
    const chainTypes = {EVM: 1, TVM: 2};

    const translator1 = await upgrades.deployProxy(Transalor, [currentChainIds[0], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await translator1.deployed();
    await translator1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
    await translator1.addRelayer(owner.address);

    const translator2 = await upgrades.deployProxy(Transalor, [currentChainIds[1], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await translator2.deployed();
    await translator2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
    await translator2.addRelayer(owner.address);

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

    const token1 = await Token.deploy(initializer1.address, TOKEN_AMOUNT.toString());
    await token1.deployed();
    const token2 = await Token.deploy(initializer2.address, TOKEN_AMOUNT.toString());
    await token2.deployed();
    await token1.addTrustedAddresses(currentChainIds, [token1.address, token2.address]);
    await token2.addTrustedAddresses(currentChainIds, [token1.address, token2.address]);

    const gas_sender1 = await upgrades.deployProxy(Gas, [initializer1.address, true], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await gas_sender1.deployed();
    const gas_sender2 = await upgrades.deployProxy(Gas, [initializer2.address, true], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await gas_sender2.deployed();
    await gas_sender1.addTrustedAddresses(currentChainIds, [gas_sender1.address, gas_sender2.address]);
    await gas_sender2.addTrustedAddresses(currentChainIds, [gas_sender1.address, gas_sender2.address]);

    // Fixtures can return anything you consider useful for your tests
    return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds};
  }

  it("Should successfuly deploy contracts", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner } = await loadFixture(deployContractsFixture);
  });
  it("Check address balances", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner } = await loadFixture(deployContractsFixture);
    let balance = await(token1.balanceOf(owner.address));
    expect(await token1.balanceOf(owner.address)).to.equal(
      TOKEN_AMOUNT.toString()
    );
  });
  it("Check address balances", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner } = await loadFixture(deployContractsFixture);
    let balance = await(token1.balanceOf(owner.address));
    expect(await token1.balanceOf(owner.address)).to.equal(
      TOKEN_AMOUNT.toString()
    );
  });
  it("Should emit event from Translator", async function () {
    let dstChainId, dstAddress, txId, transferHash, payload;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", 100))
        .to.emit(token1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(token2.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(token1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
      .to.emit(translator1, 'SendMessageEvent');
  });
  it("Should burn token", async function () {
    let dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", value))
        .to.emit(token1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(token2.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(token1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
      .to.emit(translator1, 'SendMessageEvent');
    expect(await token1.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
    expect(await token1.totalSupply()).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
  });
  it("Should burn and then mint token", async function () {
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    let addressTo = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, addressTo, value))
        .to.emit(token1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(token2.address);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(token1.initAsterizmTransfer(dstChainId, txId, transferHash, payload))
      .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {packetValue = value; return true;},
        );
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint64', 'uint', 'uint64', 'uint', 'bool', 'uint', 'bytes32', 'bytes'], packetValue);
    expect(decodedValue[0]).to.not.null; // nonce
    expect(decodedValue[1]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[2]).to.equal(token1.address); // srcAddress
    expect(decodedValue[3]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[4]).to.equal(token2.address); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[5]).to.equal(true); // useForceOrder
    expect(decodedValue[6]).to.equal(0); // txId
    expect(decodedValue[7]).to.not.null; // transferHash
    expect(decodedValue[8]).to.not.null; // payload
    expect(await token1.balanceOf(owner.address)).to.equal(
        (TOKEN_AMOUNT.sub(value))
    );
    await expect(translator2.transferMessage(300000, packetValue))
        .to.emit(token2, 'PayloadReceivedEvent');
    await expect(token2.asterizmClReceive(currentChainIds[0], token1.address, decodedValue[0], decodedValue[6], decodedValue[7], decodedValue[8])).to.not.reverted;
    expect(await token1.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
    expect(await token2.balanceOf(addressTo)).to.equal(
        value
    );
    expect(await token1.totalSupply()).to.equal(TOKEN_AMOUNT.sub(value));
    expect(await token2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value));
  });
});
