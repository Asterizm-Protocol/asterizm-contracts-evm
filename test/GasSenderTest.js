const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const bigInt = require("big-integer");

const pow = bigInt(10).pow(18);
const TOKEN_AMOUNT = bigInt('1000000').multiply(pow.toString());

describe("Gas sender test", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
    const Token = await ethers.getContractFactory("OmniChainToken");
    const Gas = await ethers.getContractFactory("GasStationUpgradeableV1");
    const [owner, user1] = await ethers.getSigners();
    const currentChainIds = [1, 2, 3];
    const chainTypes = {EVM: 1, TVM: 2};

    const translator1 = await upgrades.deployProxy(Transalor, [currentChainIds[0], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await translator1.waitForDeployment();
    await translator1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM, chainTypes.EVM]);
    await translator1.addRelayer(owner.address);

    const translator2 = await upgrades.deployProxy(Transalor, [currentChainIds[1], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await translator2.waitForDeployment();
    await translator2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM, chainTypes.EVM]);
    await translator2.addRelayer(owner.address);

    // Initializer1 deployment
    const initializer1 = await upgrades.deployProxy(Initializer, [await translator1.getAddress()], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await initializer1.waitForDeployment();

    // Initializer2 deployment
    const initializer2 = await upgrades.deployProxy(Initializer, [await translator2.getAddress()], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await initializer2.waitForDeployment();

    await translator1.setInitializer(await initializer1.getAddress());
    await translator2.setInitializer(await initializer2.getAddress());

    const token1 = await Token.deploy(await initializer1.getAddress(), TOKEN_AMOUNT.toString());
    await token1.waitForDeployment();
    const token2 = await Token.deploy(await initializer2.getAddress(), TOKEN_AMOUNT.toString());
    await token2.waitForDeployment();
    await token1.addTrustedAddresses([currentChainIds[0], currentChainIds[1]], [await token1.getAddress(), await token2.getAddress()]);
    await token2.addTrustedAddresses([currentChainIds[0], currentChainIds[1]], [await token1.getAddress(), await token2.getAddress()]);

    const gas_sender1 = await upgrades.deployProxy(Gas, [await initializer1.getAddress()], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await gas_sender1.waitForDeployment();
    const gas_sender2 = await upgrades.deployProxy(Gas, [await initializer2.getAddress()], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await gas_sender2.waitForDeployment();
    const gas_sender3 = await upgrades.deployProxy(Gas, [await initializer1.getAddress()], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await gas_sender3.waitForDeployment();
    await gas_sender1.addTrustedAddresses([currentChainIds[0], currentChainIds[1]], [await gas_sender1.getAddress(), await gas_sender2.getAddress()]);
    await gas_sender2.addTrustedAddresses([currentChainIds[0], currentChainIds[1]], [await gas_sender1.getAddress(), await gas_sender2.getAddress()]);

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
      TOKEN_AMOUNT.toString()
    );
  });
  it("Add token to whitelist", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.addStableCoin(await token1.getAddress())).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(await token2.getAddress())).not.to.be.reverted;
  });
  it("Transfer money to the contract", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner  } = await loadFixture(deployContractsFixture);
    expect(await owner.sendTransaction({
      to: await gas_sender1.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender2.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
  });
  it("Should emit event from Initializer", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.addStableCoin(await token1.getAddress())).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(await token2.getAddress())).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender1.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender2.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = bigInt(valueInUsd).multiply(pow.toString());
    expect(await token1.approve(await gas_sender1.getAddress(), value.multiply(2).toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(value.multiply(2).toString());
    const initial_token_balance = await token1.balanceOf(owner.address)
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [address, address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd * 2)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [address, address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd * 2)).not.to.be.reverted;

    await expect(gas_sender1.setMinUsdAmountPerChain(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [address, address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: minimum amount per chain validation error");
    await expect(gas_sender1.setMinUsdAmountPerChain(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmountPerChain(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [address, address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: maximum amount per chain validation error");
    await expect(gas_sender1.setMaxUsdAmountPerChain(valueInUsd)).not.to.be.reverted;

    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [address, address], await token1.getAddress()))
        .to.emit(gas_sender1, 'InitiateTransferEvent');
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(0);
  });
  it("Should emit InitiateTransferEvent event on gas contract", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.addStableCoin(await token1.getAddress())).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(await token2.getAddress())).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender1.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender2.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = bigInt(valueInUsd).multiply(pow.toString());
    expect(await token1.approve(await gas_sender1.getAddress(), value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(value.toString());
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;

    await expect(gas_sender1.setMinUsdAmountPerChain(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: minimum amount per chain validation error");
    await expect(gas_sender1.setMinUsdAmountPerChain(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmountPerChain(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: maximum amount per chain validation error");
    await expect(gas_sender1.setMaxUsdAmountPerChain(valueInUsd)).not.to.be.reverted;

    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
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
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(await gas_sender2.getAddress());
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(0);
  });
  it("Should send enc function", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.addStableCoin(await token1.getAddress())).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(await token2.getAddress())).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender1.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender2.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = bigInt(valueInUsd).multiply(pow.toString());
    expect(await token1.approve(await gas_sender1.getAddress(), value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(value.toString());
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;

    await expect(gas_sender1.setMinUsdAmountPerChain(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: minimum amount per chain validation error");
    await expect(gas_sender1.setMinUsdAmountPerChain(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmountPerChain(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: maximum amount per chain validation error");
    await expect(gas_sender1.setMaxUsdAmountPerChain(valueInUsd)).not.to.be.reverted;

    let feeValue, dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
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
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(await gas_sender2.getAddress());
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(0);
    let capturedValue;
    await expect(gas_sender1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    await expect(translator2.transferMessage(300000, capturedValue))
        .to.emit(gas_sender2, 'PayloadReceivedEvent');
  });
  it("Should not transfer same message second time", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds  } = await loadFixture(deployContractsFixture);
    await expect(gas_sender1.addStableCoin(await token1.getAddress())).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(await token2.getAddress())).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender1.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender2.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let rate = 2;
    let hexRate = '0000000000000000000000000000000000000000000000000000000000000002';
    let provider = ethers.provider;
    const decimals = await token1.decimals();
    let beforeTxGasBalance = bigInt(await(provider.getBalance(await gas_sender1.getAddress())));
    let beforeTxUserBalance = bigInt(await(provider.getBalance(address)));
    let valueInUsd = 100;
    let value = bigInt(valueInUsd).multiply(pow.toString());
    expect(await token1.approve(await gas_sender1.getAddress(), value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(value.toString());
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;

    await expect(gas_sender1.setMinUsdAmountPerChain(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: minimum amount per chain validation error");
    await expect(gas_sender1.setMinUsdAmountPerChain(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmountPerChain(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: maximum amount per chain validation error");
    await expect(gas_sender1.setMaxUsdAmountPerChain(valueInUsd)).not.to.be.reverted;

    let feeValue, dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
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
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(await gas_sender2.getAddress());
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore.toString());
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(0);
    let capturedValue;
    await expect(gas_sender1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await gas_sender1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await gas_sender2.getAddress()); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(false); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    await expect(translator2.transferMessage(300000, capturedValue))
        .to.emit(gas_sender2, 'PayloadReceivedEvent');
    let payloadValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint', 'uint', 'uint', 'uint', 'uint'], payload.toString());
    expect(payloadValue[0]).to.equal(address);
    expect(payloadValue[1]).to.equal(value.toString());
    expect(payloadValue[2]).to.equal(0);
    expect(payloadValue[3]).to.equal(await token1.getAddress());
    expect(payloadValue[4]).to.equal(decimals);
    let finalPayload = payload.toString() + hexRate;
    await expect(gas_sender2.asterizmClReceive(currentChainIds[0], await gas_sender1.getAddress(), decodedValue[4], decodedValue[6], finalPayload)).to.not.reverted;
    expect(await(provider.getBalance(await gas_sender2.getAddress()))).to.equal(beforeTxGasBalance.subtract(valueInUsd * rate).toString());
    expect(await(provider.getBalance(address))).to.equal(beforeTxUserBalance.add(valueInUsd * rate).toString());
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore.toString());
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(0);
    await expect(gas_sender2.asterizmClReceive(currentChainIds[0], await gas_sender1.getAddress(), decodedValue[4], decodedValue[6], finalPayload))
        .to.be.revertedWithCustomError(gas_sender2, 'CustomError')
        .withArgs(4006);
  });
  it("Should send money, receive tokens and withdraw tokens two times", async function () {
    let capturedValue;
    let rate = 2;
    let hexRate = '0000000000000000000000000000000000000000000000000000000000000002';
    let valueInUsd = 100;
    let address = "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168";
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds  } = await loadFixture(deployContractsFixture);
    const decimals = await token1.decimals();
    let value = bigInt(valueInUsd).multiply(pow.toString());
    await expect(gas_sender1.addStableCoin(await token1.getAddress())).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(await token2.getAddress())).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender1.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender2.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    let provider = ethers.provider;
    let beforeTxGasBalance = bigInt(await(provider.getBalance(await gas_sender1.getAddress())));
    let beforeTxUserBalance = bigInt(await(provider.getBalance(address)));
    expect(await token1.approve(await gas_sender1.getAddress(), value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(value.toString());
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;

    await expect(gas_sender1.setMinUsdAmountPerChain(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: minimum amount per chain validation error");
    await expect(gas_sender1.setMinUsdAmountPerChain(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmountPerChain(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWith("GasStation: maximum amount per chain validation error");
    await expect(gas_sender1.setMaxUsdAmountPerChain(valueInUsd)).not.to.be.reverted;

    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
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
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(await gas_sender2.getAddress());
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(0);
    let feeValue, PacketValue;
    await expect(gas_sender1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    // Check decoded Packet data
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], PacketValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await gas_sender1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await gas_sender2.getAddress()); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(false); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    await expect(translator2.transferMessage(300000, PacketValue))
        .to.emit(gas_sender2, 'PayloadReceivedEvent');
    let payloadValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint', 'uint', 'uint', 'uint', 'uint'], payload.toString());
    expect(payloadValue[0]).to.equal(address);
    expect(payloadValue[1]).to.equal(value.toString());
    expect(payloadValue[2]).to.equal(0);
    expect(payloadValue[3]).to.equal(await token1.getAddress());
    expect(payloadValue[4]).to.equal(decimals);
    let finalPayload = payload.toString() + hexRate;
    await gas_sender2.asterizmClReceive(currentChainIds[0], await gas_sender1.getAddress(), decodedValue[4], decodedValue[6], finalPayload);
    expect(await(provider.getBalance(await gas_sender2.getAddress()))).to.equal(beforeTxGasBalance.subtract(valueInUsd * rate).toString());
    expect(await(provider.getBalance(address))).to.equal(beforeTxUserBalance.add(valueInUsd * rate).toString());
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(0);

    beforeTxGasBalance = bigInt(await(provider.getBalance(await gas_sender2.getAddress())));
    beforeTxUserBalance = bigInt(await(provider.getBalance(address)));
    expect(await token1.approve(await gas_sender1.getAddress(), value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(value.toString());
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
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
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(await gas_sender2.getAddress());
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(0);
    await expect(gas_sender1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    // Check decoded Packet data
    decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], PacketValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await gas_sender1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await gas_sender2.getAddress()); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(1); // txId
    expect(decodedValue[5]).to.equal(false); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    await expect(translator2.transferMessage(300000, PacketValue))
        .to.emit(gas_sender2, 'PayloadReceivedEvent');
    payloadValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint', 'uint', 'uint', 'uint', 'uint'], payload.toString());
    expect(payloadValue[0]).to.equal(address);
    expect(payloadValue[1]).to.equal(value.toString());
    expect(payloadValue[2]).to.equal(1);
    expect(payloadValue[3]).to.equal(await token1.getAddress());
    expect(payloadValue[4]).to.equal(decimals);
    finalPayload = payload.toString() + hexRate;
    await gas_sender2.asterizmClReceive(currentChainIds[0], await gas_sender1.getAddress(), decodedValue[4], decodedValue[6], finalPayload);
    expect(await(provider.getBalance(await gas_sender2.getAddress()))).to.equal(beforeTxGasBalance.subtract(valueInUsd * rate).toString());
    expect(await(provider.getBalance(address))).to.equal(beforeTxUserBalance.add(valueInUsd * rate).toString());
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(0);
  });
  it("Should send money and failed with not trusted address", async function () {
    let valueInUsd = 100;
    let address = "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168";
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds  } = await loadFixture(deployContractsFixture);
    let value = bigInt(valueInUsd).multiply(pow.toString());
    await expect(gas_sender3.addStableCoin(await token1.getAddress())).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(await token2.getAddress())).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender3.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender2.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    expect(await token1.approve(await gas_sender3.getAddress(), value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, await gas_sender3.getAddress())).to.equal(value.toString());
    const initial_token_balance = await token1.balanceOf(owner.address);
    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender3.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWithCustomError(gas_sender2, 'CustomError')
        .withArgs(4011);
    await gas_sender3.addTrustedAddress(currentChainIds[1], await gas_sender2.getAddress());
    await expect(gas_sender3.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
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
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(await gas_sender2.getAddress());
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, await gas_sender1.getAddress())).to.equal(0);
    let feeValue, PacketValue;
    await expect(gas_sender3.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    // Check decoded Packet data
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], PacketValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await gas_sender3.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await gas_sender2.getAddress()); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(false); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    let psSrcChainId, psSrcAddress, psDstChainId, psDstAddress, psTransferHash, psReason;
    await expect(translator2.transferMessage(300000, PacketValue))
        .to.emit(initializer2, 'PayloadErrorEvent')
        .withArgs(
            (value) => {psSrcChainId = value; return true;},
            (value) => {psSrcAddress = value; return true;},
            (value) => {psDstChainId = value; return true;},
            (value) => {psDstAddress = value; return true;},
            (value) => {psTransferHash = value; return true;},
            (value) => {psReason = value; return true;},
        );
    expect(psSrcChainId).to.equal(currentChainIds[0]);
    expect(psSrcAddress).to.equal(await gas_sender3.getAddress());
    expect(psDstChainId).to.equal(currentChainIds[1]);
    expect(psDstAddress).to.equal(await gas_sender2.getAddress());
    expect(psTransferHash).not.null;
    expect(psReason.toString()).to.equal('0x18c120220000000000000000000000000000000000000000000000000000000000000fa3'); // CustomError(4003)
  });
  it("Should revert transfers with outbound transfer errors", async function () {
    let valueInUsd = 100;
    let address = "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168";
    const failedTransferHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds  } = await loadFixture(deployContractsFixture);
    let value = bigInt(valueInUsd).multiply(pow.toString());
    await expect(gas_sender3.addStableCoin(await token1.getAddress())).not.to.be.reverted;
    await expect(gas_sender2.addStableCoin(await token2.getAddress())).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender3.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    expect(await owner.sendTransaction({
      to: await gas_sender2.getAddress(),
      value: bigInt(1).multiply(pow.toString()).toString(),
    })).not.to.be.reverted;
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    expect(await token1.approve(await gas_sender3.getAddress(), value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, await gas_sender3.getAddress())).to.equal(value.toString());
    const initial_token_balance = await token1.balanceOf(owner.address);
    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender3.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
        .to.be.revertedWithCustomError(gas_sender3, 'CustomError')
        .withArgs(4011);
    await gas_sender3.addTrustedAddress(currentChainIds[1], await gas_sender2.getAddress());
    await expect(gas_sender3.sendGas([currentChainIds[1]], [value.toString()], [address], await token1.getAddress()))
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
            (value) => {gasTxId = value; return true;},
            (value) => {gasPayload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstChainId).to.equal(gasDstChainId);
    expect(dstAddress).to.equal(await gas_sender2.getAddress());
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, await gas_sender3.getAddress())).to.equal(0);
    let feeValue, PacketValue;
    await expect(gas_sender3.initAsterizmTransfer(dstChainId, txId, failedTransferHash))
        .to.be.revertedWithCustomError(gas_sender3, 'CustomError')
        .withArgs(4007);
    await expect(gas_sender3.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    // Check decoded Packet data
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], PacketValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await gas_sender3.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await gas_sender2.getAddress()); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(txId); // txId
    expect(decodedValue[5]).to.equal(false); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    await expect(gas_sender3.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.be.revertedWithCustomError(gas_sender3, 'CustomError')
        .withArgs(4008);
  });
  it("Should withdraw coins", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Gas, gas_sender1, gas_sender2, gas_sender3, owner, user1, currentChainIds } = await loadFixture(deployContractsFixture);
    const balance = bigInt(1).multiply(pow.toString()).toString();
    const wrongValue = bigInt(2).multiply(pow.toString()).toString();
    const userBalance = bigInt(await ethers.provider.getBalance(user1.address));
    await owner.sendTransaction({
      to: await gas_sender1.getAddress(),
      value: balance.toString()
    });
    expect(await(ethers.provider.getBalance(await gas_sender1.getAddress()))).to.equal(balance.toString());
    await expect(gas_sender1.withdrawCoins(user1.address, wrongValue.toString()))
        .to.be.revertedWithCustomError(gas_sender1, 'CustomErrorWithdraw')
        .withArgs(6003);
    await gas_sender1.withdrawCoins(user1.address, balance.toString());
    expect(await(ethers.provider.getBalance(await gas_sender1.getAddress()))).to.equal(0);
    expect(await(ethers.provider.getBalance(user1.address))).to.equal(userBalance.add(balance.toString()).toString());
  });
});
