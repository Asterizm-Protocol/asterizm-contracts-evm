const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const {BigNumber} = require("ethers");

let pow = BigNumber.from(10).pow(18);
const TOKEN_AMOUNT = BigNumber.from(1000000).mul(pow);

describe("Token contract test", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializer");
    const Transalor = await ethers.getContractFactory("AsterizmTranslator");
    const Token = await ethers.getContractFactory("MultichainToken");
    const Claimer = await ethers.getContractFactory("Claimer");
    const Nonce = await ethers.getContractFactory("AsterizmNonce");
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

    const token1 = await Token.deploy(initializer1.address, TOKEN_AMOUNT.toString());
    await token1.deployed();
    const token2 = await Token.deploy(initializer2.address, TOKEN_AMOUNT.toString());
    await token2.deployed();

    const claimer1 = await Claimer.deploy(token1.address);
    await claimer1.deployed();
    const claimer2 = await Claimer.deploy(token2.address);
    await claimer2.deployed();

    await initializer1.addClient(token1.address, true);
    await initializer1.addClient(claimer1.address, true);
    await initializer2.addClient(token2.address, true);
    await initializer2.addClient(claimer2.address, true);

    // Fixtures can return anything you consider useful for your tests
    return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Claimer, claimer1, claimer2, owner, currentChainIds};
  }

  it("Should successfuly deploy contracts", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Claimer, claimer1, claimer2, owner } = await loadFixture(deployContractsFixture);
  });

  it("Should claim token", async function () {
    let capturedValue;
    const captureValue = (value) => {
      capturedValue = value
      return true
    };
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    const value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Claimer, claimer1, claimer2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, address, value, token2.address))
      .to.emit(translator1, 'Packet')
      .withArgs(captureValue);
    expect(await token1.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
    await translator2.translateMessage(300000, capturedValue);
    expect(await token1.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
    expect(await token2.balanceOf(address)).to.equal(
      100
    );
    expect(await token1.totalSupply()).to.equal(TOKEN_AMOUNT.sub(value));
    expect(await token2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value));
    await token1.transfer(claimer1.address, await token1.balanceOf(owner.address));
    const amounts = [10,20];
    const addresses = [token1.address, token2.address];
    await expect(claimer1.claim(currentChainIds, amounts, addresses))
      .to.emit(translator1, 'Packet')
      .withArgs(captureValue);
  });

  it("Should claim and send token", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    };
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    const value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Claimer, claimer1, claimer2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, address, value, token2.address))
      .to.emit(translator1, 'Packet')
      .withArgs(captureValue);
    expect(await token1.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT.sub(value))
    );
    await translator2.translateMessage(300000, capturedValue);
    expect(await token2.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT)
    );
    expect(await token2.balanceOf(address)).to.equal(
      value
    );
    expect(await token2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value));
    await token1.transfer(claimer1.address, await token1.balanceOf(owner.address));

    const amounts = [10];
    await expect(await claimer1.claim([currentChainIds[1]], amounts, [token1.address]))
      .to.emit(translator1, 'Packet')
      .withArgs(captureValue)
    await translator2.translateMessage(300000, capturedValue);
    expect(await token2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value));
    expect(await token2.balanceOf(owner.address)).to.equal(TOKEN_AMOUNT);
  });

  it("Should claim and send token", async function () {
    let capturedValue
    const captureValue = (value) => {
      capturedValue = value
      return true
    };
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    const value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Claimer, claimer1, claimer2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, address, value, token2.address))
      .to.emit(translator1, 'Packet')
      .withArgs(captureValue);
    expect(await token1.balanceOf(owner.address)).to.equal(
        (TOKEN_AMOUNT.sub(value))
    );
    await translator2.translateMessage(300000, capturedValue);
    expect(await token2.balanceOf(owner.address)).to.equal(
        (TOKEN_AMOUNT)
    );
    expect(await token2.balanceOf(address)).to.equal(
        value
    );
    expect(await token2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value));
    await token1.transfer(claimer1.address, await token1.balanceOf(owner.address));


    const amounts = [10,20,30];
    const addresses = [token1.address, '0x1679467004A2C0CD2FCF07580fE483E20bc9E7ac', '0x5B732fE1565775a1404186f9F57A8b8F5fabDd64'];
    await expect(await claimer1.claim(currentChainIds, amounts, addresses)).not.to.be.reverted;
  });

});
