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

    const token1 = await Token.deploy(initializer1.address, TOKEN_AMOUNT.toString());
    await token1.deployed();
    const token2 = await Token.deploy(initializer2.address, TOKEN_AMOUNT.toString());
    await token2.deployed();
    await token1.addTrustedSourceAddresses(currentChainIds, [token1.address, token2.address]);
    await token2.addTrustedSourceAddresses(currentChainIds, [token1.address, token2.address]);

    const gas_sender1 = await Gas.deploy(initializer1.address, true, true);
    await gas_sender1.deployed();
    const gas_sender2 = await Gas.deploy(initializer2.address, true, true);
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
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", 100, token2.address))
      .to.emit(translator1, 'SendMessageEvent')
  });
  it("Should burn token", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", value, token2.address))
      .to.emit(translator1, 'SendMessageEvent');
    expect(await token1.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
    expect(await token1.totalSupply()).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
  });
  it("Should burn and then mint token", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    }
    let addressTo = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, addressTo, value, token2.address))
      .to.emit(translator1, 'SendMessageEvent')
      .withArgs(captureValue);
    expect(await token1.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
    await translator2.transferMessage([300000, capturedValue]);
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
