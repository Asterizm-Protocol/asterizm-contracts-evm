const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const {BigNumber} = require("ethers");

const pow = BigNumber.from(10).pow(18);
const TOKEN_AMOUNT = BigNumber.from(1000000).mul(pow);

describe("Gas sender test", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializer");
    const Transalor = await ethers.getContractFactory("AsterizmTranslator");
    const Nonce = await ethers.getContractFactory("AsterizmNonce");
    const Token = await ethers.getContractFactory("MultichainToken");
    const Gas = await ethers.getContractFactory("GasSender");
    const [owner, user1] = await ethers.getSigners();
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

    const gas_sender1 = await Gas.deploy(initializer1.address);
    await gas_sender1.deployed();

    const gas_sender2 = await Gas.deploy(initializer2.address);
    await gas_sender2.deployed();

    await initializer1.addClient(token1.address, true);
    await initializer1.addClient(gas_sender1.address, true);
    await initializer2.addClient(token2.address, true);
    await initializer2.addClient(gas_sender2.address, true);

    // Fixtures can return anything you consider useful for your tests
    return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, owner, user1, currentChainIds};
  }

  it("Should successfuly deploy contracts", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, owner, user1, currentChainIds } = await loadFixture(deployContractsFixture);
  });
  it("Check address balances", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner } = await loadFixture(deployContractsFixture);
    let balance = await(token1.balanceOf(owner.address));
    expect(await token1.balanceOf(owner.address)).to.equal(
      TOKEN_AMOUNT
    );
  });
  it("Add token to a whitelist", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, owner  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.authorizeStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.authorizeStableCoin(token2.address)).not.to.be.reverted;
  });
  it("Transfer money to the contract", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, owner  } = await loadFixture(deployContractsFixture);
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("10"), // Sends exactly 1.0 ether
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("1"), // Sends exactly 1.0 ether
    })).not.to.be.reverted;
  });
  it("Should emit event from Translator", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    expect(await token1.crossChainTransfer(currentChainIds[0], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", 100, token1.address)).not.to.be.reverted;
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", 100, token1.address))
      .to.emit(translator1, 'Packet');
  });
  it("Should emit event from Initializer", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, owner, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.authorizeStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.authorizeStableCoin(token2.address)).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
    })).not.to.be.reverted;
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = BigNumber.from(valueInUsd).mul(pow);
    expect(await token1.approve(gas_sender1.address, value.mul(2).toString())).not.to.be.reverted;
    const initial_token_balance = await token1.balanceOf(owner.address)
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc(currentChainIds, [value.toString(), value.toString()], [gas_sender1.address, gas_sender2.address], [address, address], token1.address))
        .to.be.revertedWith("GasSender: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd * 2)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc(currentChainIds, [value.toString(), value.toString()], [gas_sender1.address, gas_sender2.address], [address, address], token1.address))
        .to.be.revertedWith("GasSender: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd * 2)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc(currentChainIds, [value.toString(), value.toString()], [gas_sender1.address, gas_sender2.address], [address, address], token1.address))
        .to.emit(gas_sender1, 'MessageSent');
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(
        value.mul(2)
    );
    expect(await token1.balanceOf(owner.address)).not.to.equal(
        initial_token_balance
    )
  });
  it("Should emit MessageSent event on gas contract", async function () {
    const captureValue = (value) => {
      console.log(value);
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, owner, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.authorizeStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.authorizeStableCoin(token2.address)).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
    })).not.to.be.reverted;
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = BigNumber.from(valueInUsd).mul(pow);
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    const initial_token_balance = await token1.balanceOf(owner.address);
    let dstChainId, destination, transactionId, forceOrdered, payload;
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasSender: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasSender: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.emit(gas_sender1, 'MessageSent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {destination = value; return true;},
            (value) => {transactionId = value; return true;},
            (value) => {forceOrdered = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(destination).to.equal(gas_sender2.address);
    expect(transactionId).to.equal(0);
    expect(forceOrdered).to.equal(false);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    expect(await token1.balanceOf(owner.address)).not.to.equal(initial_token_balance)
  });
  it("Should send enc function", async function () {
    const captureValue = (value) => {
      console.log(value);
      return true
    }
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, owner, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.authorizeStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.authorizeStableCoin(token2.address)).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
    })).not.to.be.reverted;
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = BigNumber.from(valueInUsd).mul(pow);
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    const initial_token_balance = await token1.balanceOf(owner.address);
    let dstChainId, destination, transactionId, forceOrdered, payload;
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasSender: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasSender: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.emit(gas_sender1, 'MessageSent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {destination = value; return true;},
            (value) => {transactionId = value; return true;},
            (value) => {forceOrdered = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(destination).to.equal(gas_sender2.address);
    expect(transactionId).to.equal(0);
    expect(forceOrdered).to.equal(false);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    expect(await token1.balanceOf(owner.address)).not.to.equal(initial_token_balance);
    let capturedValue;
    await expect(gas_sender1._sendMessage(dstChainId, destination, transactionId, payload))
        .to.emit(translator1, 'Packet')
        .withArgs((value) => {capturedValue = value; return true;});
    await expect(translator2.translateEncodedMessage(300000, capturedValue))
        .to.emit(gas_sender2, 'EncodedPayloadReceived');
  });
  it("Should send money, receive tokens and withdraw tokens", async function () {
    let capturedValue;
    let rate = 2;
    let hexRate = '0000000000000000000000000000000000000000000000000000000000000002';
    let valueInUsd = 100;
    let address = "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168";
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, owner, user1, currentChainIds  } = await loadFixture(deployContractsFixture);
    const decimals = await token1.decimals();
    let value = BigNumber.from(valueInUsd).mul(pow);
    await expect(gas_sender1.authorizeStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.authorizeStableCoin(token2.address)).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
    })).not.to.be.reverted;
    let provider = ethers.provider;
    let beforeTxGasBalance = await(provider.getBalance(gas_sender1.address));
    let beforeTxUserBalance = await(provider.getBalance(address));
    let dstChainId, destination, transactionId, forceOrdered, payload;
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasSender: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasSender: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.sendGasEnc([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.emit(gas_sender1, 'MessageSent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {destination = value; return true;},
            (value) => {transactionId = value; return true;},
            (value) => {forceOrdered = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(destination).to.equal(gas_sender2.address);
    expect(transactionId).to.equal(0);
    expect(forceOrdered).to.equal(false);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    expect(await token1.balanceOf(owner.address)).not.to.equal(initial_token_balance);
    let PacketValue;
    await expect(gas_sender1._sendMessage(dstChainId, destination, transactionId, payload))
        .to.emit(translator1, 'Packet')
        .withArgs((value) => {PacketValue = value; return true;});
    // Check decoded Packet data
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint64', 'address', 'uint64', 'address', 'uint', 'uint', 'bool', 'bool', 'bool', 'bytes'], PacketValue);
    expect(decodedValue[1]).to.equal(currentChainIds[0]);
    expect(decodedValue[2]).to.equal(gas_sender1.address);
    expect(decodedValue[3]).to.equal(currentChainIds[1]);
    expect(decodedValue[4]).to.equal(gas_sender2.address);
    expect(decodedValue[5]).to.equal(0);
    expect(decodedValue[6]).to.equal(0);
    expect(decodedValue[7]).to.equal(true);
    expect(decodedValue[8]).to.equal(false);
    expect(decodedValue[9]).to.equal(true);
    await expect(translator2.translateEncodedMessage(300000, PacketValue))
        .to.emit(gas_sender2, 'EncodedPayloadReceived');
    let payloadValue = ethers.utils.defaultAbiCoder.decode(['address', 'uint', 'address', 'uint'], decodedValue[10].toString());
    expect(payloadValue[0]).to.equal(address);
    expect(payloadValue[1]).to.equal(value);
    expect(payloadValue[2]).to.equal(token1.address);
    expect(payloadValue[3]).to.equal(decimals);
    let finalPayload = decodedValue[10].toString() + hexRate;
    await gas_sender2.asterismReceive(currentChainIds[0], gas_sender1.address, 1, 1, finalPayload);
    expect(await(provider.getBalance(gas_sender2.address))).to.equal(beforeTxGasBalance.sub(valueInUsd * rate));
    expect(await(provider.getBalance(address))).to.equal(beforeTxUserBalance.add(valueInUsd * rate));

    const wrongValue = BigNumber.from(200).mul(pow);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    await expect(gas_sender1.withdrawTokens(translator1.address, user1.address, value.toString())).to.be.revertedWith(
        "GasSender: token not exists"
    );
    await expect(gas_sender1.withdrawTokens(token1.address, user1.address, wrongValue.toString())).to.be.revertedWith(
        "GasSender: tokens balance not enough"
    );
    await gas_sender1.withdrawTokens(token1.address, user1.address, value);
    expect((await gas_sender1.stableCoins(token1.address)).balance).to.equal(0);
    expect(await token1.balanceOf(user1.address)).to.equal(value);
  });
  it("Should withdraw coins", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, owner, user1, currentChainIds } = await loadFixture(deployContractsFixture);
    const balance = ethers.utils.parseEther("1.0");
    const wrongValue = ethers.utils.parseEther("2.0");
    const userBalance = await ethers.provider.getBalance(user1.address);
    await owner.sendTransaction({
      to: gas_sender1.address,
      value: balance
    });
    expect(await(ethers.provider.getBalance(gas_sender1.address))).to.equal(balance);
    await expect(gas_sender1.withdrawCoins(user1.address, wrongValue)).to.be.revertedWith(
        "GasSender: coins balance not enough"
    );
    await gas_sender1.withdrawCoins(user1.address, balance);
    expect(await(ethers.provider.getBalance(gas_sender1.address))).to.equal(0);
    expect(await(ethers.provider.getBalance(user1.address))).to.equal(userBalance.add(balance));
  });
});
