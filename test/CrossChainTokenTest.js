const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const {BigNumber} = require("ethers");

let pow = BigNumber.from(10).pow(18);
const TOKEN_AMOUNT = BigNumber.from(1000000).mul(pow);

describe("Crosschain token", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializer");
    const Transalor = await ethers.getContractFactory("AsterizmTranslator");
    const Token = await ethers.getContractFactory("MultichainToken");
    const Nonce = await ethers.getContractFactory("AsterizmNonce");
    const Gas = await ethers.getContractFactory("GasStation");
    const [owner] = await ethers.getSigners();
    const currentChainIds = [1, 2];
    let chainIds = [];
    for (let i = 0; i < currentChainIds.length; i++) {
      chainIds.push(currentChainIds[i]);
    }

    const translator1 = await Transalor.deploy(currentChainIds[0]);
    await translator1.deployed();
    await translator1.addChains(chainIds);
    await translator1.addRelayer(owner.address);

    const translator2 = await Transalor.deploy(currentChainIds[1]);
    await translator2.deployed();
    await translator2.addChains(chainIds);
    await translator2.addRelayer(owner.address);

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

    const token1 = await Token.deploy(initializer1.address, TOKEN_AMOUNT.toString());
    await token1.deployed();
    const token2 = await Token.deploy(initializer2.address, TOKEN_AMOUNT.toString());
    await token2.deployed();
    await token1.addTrustedSourceAddresses(currentChainIds, [token1.address, token2.address]);
    await token2.addTrustedSourceAddresses(currentChainIds, [token1.address, token2.address]);

    const gas_sender1 = await Gas.deploy(initializer1.address, true);
    await gas_sender1.deployed();
    const gas_sender2 = await Gas.deploy(initializer2.address, true);
    await gas_sender2.deployed();
    await gas_sender1.addTrustedSourceAddresses(currentChainIds, [gas_sender1.address, gas_sender2.address]);
    await gas_sender2.addTrustedSourceAddresses(currentChainIds, [gas_sender1.address, gas_sender2.address]);

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
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", 100, token2.address))
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
    await expect(token1.initAsterizmTransfer(dstChainId, dstAddress, txId, transferHash, payload))
      .to.emit(translator1, 'SendMessageEvent');
  });
  it("Should burn token", async function () {
    let dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", value, token2.address))
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
    await expect(token1.initAsterizmTransfer(dstChainId, dstAddress, txId, transferHash, payload))
      .to.emit(translator1, 'SendMessageEvent');
    expect(await token1.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
    expect(await token1.totalSupply()).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
  });
  it("Should burn and then mint token", async function () {
    let packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    let addressTo = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, addressTo, value, token2.address))
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
    await expect(token1.initAsterizmTransfer(dstChainId, dstAddress, txId, transferHash, payload))
      .to.emit(translator1, 'SendMessageEvent')
      .withArgs((value) => {packetValue = value; return true;})
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint64', 'address', 'uint64', 'address', 'uint', 'bool', 'uint', 'bytes32', 'bytes'], packetValue);
    // decodedValue[0] - nonce
    expect(decodedValue[1]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[2]).to.equal(token1.address); // srcAddress
    expect(decodedValue[3]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[4]).to.equal(token2.address); // dstAddress
    expect(decodedValue[5]).to.equal(0); // feeValue
    expect(decodedValue[6]).to.equal(true); // useForceOrder
    expect(decodedValue[7]).to.equal(0); // txId
    expect(decodedValue[8]).to.not.null; // transferHash
    // decodedValue[9] - payload
    expect(await token1.balanceOf(owner.address)).to.equal(
        (TOKEN_AMOUNT.sub(value))
    );
    await expect(translator2.transferMessage(300000, packetValue))
        .to.emit(token2, 'PayloadReceivedEvent');
    await expect(token2.asterizmClReceive(currentChainIds[0], token1.address, currentChainIds[1], token2.address, decodedValue[0], decodedValue[7], decodedValue[8], decodedValue[9])).to.not.reverted;
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
