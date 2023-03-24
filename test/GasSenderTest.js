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
    const Gas = await ethers.getContractFactory("GasStation");
    const [owner, user1] = await ethers.getSigners();
    const currentChainIds = [1, 2, 3];

    const translator1 = await Transalor.deploy(currentChainIds[0]);
    await translator1.deployed();
    await translator1.addChains(currentChainIds);
    await translator1.addRelayer(owner.address);

    const translator2 = await Transalor.deploy(currentChainIds[1]);
    await translator2.deployed();
    await translator2.addChains(currentChainIds);
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
    await token1.addTrustedSourceAddresses([currentChainIds[0], currentChainIds[1]], [token1.address, token2.address]);
    await token2.addTrustedSourceAddresses([currentChainIds[0], currentChainIds[1]], [token1.address, token2.address]);

    const gas_sender1 = await Gas.deploy(initializer1.address, true, true);
    await gas_sender1.deployed();
    const gas_sender2 = await Gas.deploy(initializer2.address, true, true);
    await gas_sender2.deployed();
    const gas_sender3 = await Gas.deploy(initializer1.address, true, true);
    await gas_sender3.deployed();
    await gas_sender1.addTrustedSourceAddresses([currentChainIds[0], currentChainIds[1]], [gas_sender1.address, gas_sender2.address]);
    await gas_sender2.addTrustedSourceAddresses([currentChainIds[0], currentChainIds[1]], [gas_sender1.address, gas_sender2.address]);

    // Fixtures can return anything you consider useful for your tests
    return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds};
  }

  it("Should successfuly deploy contracts", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds } = await loadFixture(deployContractsFixture);
  });
  it("Check address balances", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner } = await loadFixture(deployContractsFixture);
    let balance = await(token1.balanceOf(owner.address));
    expect(await token1.balanceOf(owner.address)).to.equal(
      TOKEN_AMOUNT
    );
  });
  it("Add token to whitelist", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.addStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(token2.address)).not.to.be.reverted;
  });
  it("Transfer money to the contract", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner  } = await loadFixture(deployContractsFixture);
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("1"),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("1"),
    })).not.to.be.reverted;
  });
  it("Should emit event from Translator", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    expect(await token1.crossChainTransfer(currentChainIds[0], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", 100, token1.address)).not.to.be.reverted;
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", 100, token1.address))
      .to.emit(translator1, 'SendMessageEvent');
  });
  it("Should emit event from Initializer", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.addStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(token2.address)).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("1.0"),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("1.0"),
    })).not.to.be.reverted;
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = BigNumber.from(valueInUsd).mul(pow);
    expect(await token1.approve(gas_sender1.address, value.mul(2).toString())).not.to.be.reverted;
    const initial_token_balance = await token1.balanceOf(owner.address)
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [gas_sender1.address, gas_sender2.address], [address, address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd * 2)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [gas_sender1.address, gas_sender2.address], [address, address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd * 2)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [gas_sender1.address, gas_sender2.address], [address, address], token1.address))
        .to.emit(gas_sender1, 'InitiateTransferEvent');
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(
        value.mul(2)
    );
    expect(await token1.balanceOf(owner.address)).not.to.equal(
        initial_token_balance
    )
  });
  it("Should emit InitiateTransferEvent event on gas contract", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.addStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(token2.address)).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("1.0"),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("1.0"),
    })).not.to.be.reverted;
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = BigNumber.from(valueInUsd).mul(pow);
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;
    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasDstAddress, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.emit(gas_sender1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        )
        .to.emit(gas_sender1, 'GasSendEvent')
        .withArgs(
            (value) => {gasDstChainId = value; return true;},
            (value) => {gasDstAddress = value; return true;},
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(dstAddress).to.equal(gasDstAddress);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    expect(await token1.balanceOf(owner.address)).not.to.equal(initial_token_balance)
  });
  it("Should send enc function", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.addStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(token2.address)).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("1.0"),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("1.0"),
    })).not.to.be.reverted;
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = BigNumber.from(valueInUsd).mul(pow);
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;
    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasDstAddress, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.emit(gas_sender1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        )
        .to.emit(gas_sender1, 'GasSendEvent')
        .withArgs(
            (value) => {gasDstChainId = value; return true;},
            (value) => {gasDstAddress = value; return true;},
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(dstAddress).to.equal(gasDstAddress);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    expect(await token1.balanceOf(owner.address)).not.to.equal(initial_token_balance);
    let capturedValue;
    await expect(gas_sender1.initAsterizmTransfer([dstChainId, dstAddress, 0, txId, transferHash, payload]))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs((value) => {capturedValue = value; return true;});
    await expect(translator2.transferMessage([300000, capturedValue]))
        .to.emit(gas_sender2, 'EncodedPayloadReceivedEvent');
  });
  it("Should not transfer same message second time", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.addStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(token2.address)).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("1.0"),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("1.0"),
    })).not.to.be.reverted;
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let rate = 2;
    let hexRate = '0000000000000000000000000000000000000000000000000000000000000002';
    let provider = ethers.provider;
    const decimals = await token1.decimals();
    let beforeTxGasBalance = await(provider.getBalance(gas_sender1.address));
    let beforeTxUserBalance = await(provider.getBalance(address));
    let valueInUsd = 100;
    let value = BigNumber.from(valueInUsd).mul(pow);
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;
    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasDstAddress, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.emit(gas_sender1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        )
        .to.emit(gas_sender1, 'GasSendEvent')
        .withArgs(
            (value) => {gasDstChainId = value; return true;},
            (value) => {gasDstAddress = value; return true;},
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(dstAddress).to.equal(gasDstAddress);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    expect(await token1.balanceOf(owner.address)).not.to.equal(initial_token_balance);
    let capturedValue;
    await expect(gas_sender1.initAsterizmTransfer([dstChainId, dstAddress, 0, txId, transferHash, payload]))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs((value) => {capturedValue = value; return true;});
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint64', 'address', 'uint64', 'address', 'uint', 'bool', 'bool', 'uint', 'bytes32', 'bytes'], capturedValue);
    // decodedValue[0] - nonce
    expect(decodedValue[1]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[2]).to.equal(gas_sender1.address); // srcAddress
    expect(decodedValue[3]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[4]).to.equal(gas_sender2.address); // dstAddress
    expect(decodedValue[5]).to.equal(0); // feeValue
    expect(decodedValue[6]).to.equal(true); // useEncryption
    expect(decodedValue[7]).to.equal(true); // useForceOrder
    expect(decodedValue[8]).to.equal(0); // txId
    expect(decodedValue[9]).to.not.null; // transferHash
    // decodedValue[10] - payload
    await expect(translator2.transferMessage([300000, capturedValue]))
        .to.emit(gas_sender2, 'EncodedPayloadReceivedEvent');
    let payloadValue = ethers.utils.defaultAbiCoder.decode(['address', 'uint', 'uint', 'address', 'uint'], decodedValue[10].toString());
    expect(payloadValue[0]).to.equal(address);
    expect(payloadValue[1]).to.equal(value);
    expect(payloadValue[2]).to.equal(0);
    expect(payloadValue[3]).to.equal(token1.address);
    expect(payloadValue[4]).to.equal(decimals);
    let finalPayload = decodedValue[10].toString() + hexRate;
    await gas_sender2.asterizmClReceive([currentChainIds[0], gas_sender1.address, currentChainIds[1], gas_sender2.address, decodedValue[0], decodedValue[8], decodedValue[9], finalPayload]);
    expect(await(provider.getBalance(gas_sender2.address))).to.equal(beforeTxGasBalance.sub(valueInUsd * rate));
    expect(await(provider.getBalance(address))).to.equal(beforeTxUserBalance.add(valueInUsd * rate));
    let wrongValue = BigNumber.from(200).mul(pow);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    await expect(gas_sender1.withdrawTokens(translator1.address, user1.address, value.toString()))
        .to.be.revertedWith("GasStation: token not exists");
    await expect(gas_sender1.withdrawTokens(token1.address, user1.address, wrongValue.toString()))
        .to.be.revertedWith("GasStation: tokens balance not enough");
    await gas_sender1.withdrawTokens(token1.address, user1.address, value);
    expect((await gas_sender1.stableCoins(token1.address)).balance).to.equal(0);
    expect(await token1.balanceOf(user1.address)).to.equal(value);
    await expect(gas_sender2.asterizmClReceive([currentChainIds[0], gas_sender1.address, currentChainIds[1], gas_sender2.address, decodedValue[0], decodedValue[8], decodedValue[9], finalPayload]))
        .to.be.revertedWith("BaseAsterizmClient: transfer executed already");
  });
  it("Should send money, receive tokens and withdraw tokens two times", async function () {
    let capturedValue;
    let rate = 2;
    let hexRate = '0000000000000000000000000000000000000000000000000000000000000002';
    let valueInUsd = 100;
    let address = "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168";
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds  } = await loadFixture(deployContractsFixture);
    const decimals = await token1.decimals();
    let value = BigNumber.from(valueInUsd).mul(pow);
    await expect(gas_sender1.addStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(token2.address)).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender1.address,
      value: ethers.utils.parseEther("1"),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("1"),
    })).not.to.be.reverted;
    let provider = ethers.provider;
    let beforeTxGasBalance = await(provider.getBalance(gas_sender1.address));
    let beforeTxUserBalance = await(provider.getBalance(address));
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;
    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasDstAddress, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.emit(gas_sender1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        )
        .to.emit(gas_sender1, 'GasSendEvent')
        .withArgs(
            (value) => {gasDstChainId = value; return true;},
            (value) => {gasDstAddress = value; return true;},
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(dstAddress).to.equal(gasDstAddress);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    expect(await token1.balanceOf(owner.address)).not.to.equal(initial_token_balance);
    let PacketValue;
    await expect(gas_sender1.initAsterizmTransfer([dstChainId, dstAddress, 0, txId, transferHash, payload]))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs((value) => {PacketValue = value; return true;});
    // Check decoded Packet data
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint64', 'address', 'uint64', 'address', 'uint', 'bool', 'bool', 'uint', 'bytes32', 'bytes'], PacketValue);
    // decodedValue[0] - nonce
    expect(decodedValue[1]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[2]).to.equal(gas_sender1.address); // srcAddress
    expect(decodedValue[3]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[4]).to.equal(gas_sender2.address); // dstAddress
    expect(decodedValue[5]).to.equal(0); // feeValue
    expect(decodedValue[6]).to.equal(true); // useEncryption
    expect(decodedValue[7]).to.equal(true); // useForceOrder
    expect(decodedValue[8]).to.equal(0); // txId
    expect(decodedValue[9]).to.not.null; // transferHash
    // decodedValue[10] - payload
    await expect(translator2.transferMessage([300000, PacketValue]))
        .to.emit(gas_sender2, 'EncodedPayloadReceivedEvent');
    let payloadValue = ethers.utils.defaultAbiCoder.decode(['address', 'uint', 'uint', 'address', 'uint'], decodedValue[10].toString());
    expect(payloadValue[0]).to.equal(address);
    expect(payloadValue[1]).to.equal(value);
    expect(payloadValue[2]).to.equal(0);
    expect(payloadValue[3]).to.equal(token1.address);
    expect(payloadValue[4]).to.equal(decimals);
    let finalPayload = decodedValue[10].toString() + hexRate;
    await gas_sender2.asterizmClReceive([currentChainIds[0], gas_sender1.address, currentChainIds[1], gas_sender2.address, decodedValue[0], decodedValue[8], decodedValue[9], finalPayload]);
    expect(await(provider.getBalance(gas_sender2.address))).to.equal(beforeTxGasBalance.sub(valueInUsd * rate));
    expect(await(provider.getBalance(address))).to.equal(beforeTxUserBalance.add(valueInUsd * rate));
    let wrongValue = BigNumber.from(200).mul(pow);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    await expect(gas_sender1.withdrawTokens(translator1.address, user1.address, value.toString()))
        .to.be.revertedWith("GasStation: token not exists");
    await expect(gas_sender1.withdrawTokens(token1.address, user1.address, wrongValue.toString()))
        .to.be.revertedWith("GasStation: tokens balance not enough");
    await gas_sender1.withdrawTokens(token1.address, user1.address, value);
    expect((await gas_sender1.stableCoins(token1.address)).balance).to.equal(0);
    expect(await token1.balanceOf(user1.address)).to.equal(value);

    beforeTxGasBalance = await(provider.getBalance(gas_sender2.address));
    beforeTxUserBalance = await(provider.getBalance(address));
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.emit(gas_sender1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        )
        .to.emit(gas_sender1, 'GasSendEvent')
        .withArgs(
            (value) => {gasDstChainId = value; return true;},
            (value) => {gasDstAddress = value; return true;},
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(dstAddress).to.equal(gasDstAddress);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    expect(await token1.balanceOf(owner.address)).not.to.equal(initial_token_balance);
    await expect(gas_sender1.initAsterizmTransfer([dstChainId, dstAddress, 0, txId, transferHash, payload]))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs((value) => {PacketValue = value; return true;});
    // Check decoded Packet data
    decodedValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint64', 'address', 'uint64', 'address', 'uint', 'bool', 'bool', 'uint', 'bytes32', 'bytes'], PacketValue);
    // decodedValue[0] - nonce
    expect(decodedValue[1]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[2]).to.equal(gas_sender1.address); // srcAddress
    expect(decodedValue[3]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[4]).to.equal(gas_sender2.address); // dstAddress
    expect(decodedValue[5]).to.equal(0); // feeValue
    expect(decodedValue[6]).to.equal(true); // useEncryption
    expect(decodedValue[7]).to.equal(true); // useForceOrder
    expect(decodedValue[8]).to.equal(1); // txId
    expect(decodedValue[9]).to.not.null; // transferHash
    // decodedValue[10] - payload
    await expect(translator2.transferMessage([300000, PacketValue]))
        .to.emit(gas_sender2, 'EncodedPayloadReceivedEvent');
    payloadValue = ethers.utils.defaultAbiCoder.decode(['address', 'uint', 'uint', 'address', 'uint'], decodedValue[10].toString());
    expect(payloadValue[0]).to.equal(address);
    expect(payloadValue[1]).to.equal(value);
    expect(payloadValue[2]).to.equal(1);
    expect(payloadValue[3]).to.equal(token1.address);
    expect(payloadValue[4]).to.equal(decimals);
    finalPayload = decodedValue[10].toString() + hexRate;
    await gas_sender2.asterizmClReceive([currentChainIds[0], gas_sender1.address, currentChainIds[1], gas_sender2.address, decodedValue[0], decodedValue[8], decodedValue[9], finalPayload]);
    expect(await(provider.getBalance(gas_sender2.address))).to.equal(beforeTxGasBalance.sub(valueInUsd * rate));
    expect(await(provider.getBalance(address))).to.equal(beforeTxUserBalance.add(valueInUsd * rate));

    wrongValue = BigNumber.from(200).mul(pow);
    expect(await token1.balanceOf(gas_sender1.address)).to.equal(value);
    await expect(gas_sender1.withdrawTokens(translator1.address, user1.address, value.toString())).to.be.revertedWith(
        "GasStation: token not exists"
    );
    await expect(gas_sender1.withdrawTokens(token1.address, user1.address, wrongValue.toString())).to.be.revertedWith(
        "GasStation: tokens balance not enough"
    );
    await gas_sender1.withdrawTokens(token1.address, user1.address, value);
    expect((await gas_sender1.stableCoins(token1.address)).balance).to.equal(0);
    expect(await token1.balanceOf(user1.address)).to.equal(value.mul(2));
  });
  it("Should send money and failed with not trusted address", async function () {
    let valueInUsd = 100;
    let address = "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168";
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds  } = await loadFixture(deployContractsFixture);
    let value = BigNumber.from(valueInUsd).mul(pow);
    await expect(gas_sender3.addStableCoin(token1.address)).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(token2.address)).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender3.address,
      value: ethers.utils.parseEther("1.0"),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: gas_sender2.address,
      value: ethers.utils.parseEther("1.0"),
    })).not.to.be.reverted;
    expect(await token1.approve(gas_sender3.address, value.toString())).not.to.be.reverted;
    const initial_token_balance = await token1.balanceOf(owner.address);
    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasDstAddress, gasTxId, gasPayload;
    await expect(gas_sender3.sendGas([currentChainIds[1]], [value.toString()], [gas_sender2.address], [address], token1.address))
        .to.emit(gas_sender3, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        )
        .to.emit(gas_sender3, 'GasSendEvent')
        .withArgs(
            (value) => {gasDstChainId = value; return true;},
            (value) => {gasDstAddress = value; return true;},
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(dstAddress).to.equal(gasDstAddress);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(gas_sender3.address)).to.equal(value);
    expect(await token1.balanceOf(owner.address)).not.to.equal(initial_token_balance);
    let PacketValue;
    await expect(gas_sender3.initAsterizmTransfer([dstChainId, dstAddress, 0, txId, transferHash, payload]))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs((value) => {PacketValue = value; return true;});
    // Check decoded Packet data
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint64', 'address', 'uint64', 'address', 'uint', 'bool', 'bool', 'uint', 'bytes32', 'bytes'], PacketValue);
    // decodedValue[0] - nonce
    expect(decodedValue[1]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[2]).to.equal(gas_sender3.address); // srcAddress
    expect(decodedValue[3]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[4]).to.equal(gas_sender2.address); // dstAddress
    expect(decodedValue[5]).to.equal(0); // feeValue
    expect(decodedValue[6]).to.equal(true); // useEncryption
    expect(decodedValue[7]).to.equal(true); // useForceOrder
    expect(decodedValue[8]).to.equal(0); // txId
    expect(decodedValue[9]).to.not.null; // transferHash
    // decodedValue[10] - payload
    let psSrcChainId, psSrcAddress, psDstChainId, psDstAddress, psNonce, psTransferHash, psPayload, psReason;
    await expect(translator2.transferMessage([300000, PacketValue]))
        .to.emit(initializer2, 'PayloadErrorEvent')
        .withArgs(
            (value) => {psSrcChainId = value; return true;},
            (value) => {psSrcAddress = value; return true;},
            (value) => {psDstChainId = value; return true;},
            (value) => {psDstAddress = value; return true;},
            (value) => {psNonce = value; return true;},
            (value) => {psTransferHash = value; return true;},
            (value) => {psPayload = value; return true;},
            (value) => {psReason = value; return true;},
        );
    expect(psSrcChainId).to.equal(currentChainIds[0]);
    expect(psSrcAddress).to.equal(gas_sender3.address);
    expect(psDstChainId).to.equal(currentChainIds[1]);
    expect(psDstAddress).to.equal(gas_sender2.address);
    expect(psNonce).to.equal(1);
    expect(psTransferHash).not.null;
    expect(psPayload).not.null;
    expect(ethers.utils.defaultAbiCoder.decode(['string'], psReason.toString())[0]).to.equal('BaseAsterizmClient: wrong source address');
  });
  it("Should withdraw coins", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds } = await loadFixture(deployContractsFixture);
    const balance = ethers.utils.parseEther("1.0");
    const wrongValue = ethers.utils.parseEther("2.0");
    const userBalance = await ethers.provider.getBalance(user1.address);
    await owner.sendTransaction({
      to: gas_sender1.address,
      value: balance
    });
    expect(await(ethers.provider.getBalance(gas_sender1.address))).to.equal(balance);
    await expect(gas_sender1.withdrawCoins(user1.address, wrongValue)).to.be.revertedWith(
        "GasStation: coins balance not enough"
    );
    await gas_sender1.withdrawCoins(user1.address, balance);
    expect(await(ethers.provider.getBalance(gas_sender1.address))).to.equal(0);
    expect(await(ethers.provider.getBalance(user1.address))).to.equal(userBalance.add(balance));
  });
});
