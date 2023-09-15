const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const bigInt = require("big-integer");

const pow = BigNumber.from(10).pow(18);
const TOKEN_AMOUNT = BigNumber.from(1000000).mul(pow);

describe("Gas sender test", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
    const Nonce = await ethers.getContractFactory("AsterizmNonce");
    const Token = await ethers.getContractFactory("MultichainToken");
    const Gas = await ethers.getContractFactory("GasStationUpgradeableV1");
    const [owner, user1] = await ethers.getSigners();
    const currentChainIds = [1, 2, 3];
    const chainTypes = {EVM: 1, TVM: 2};

    const translator1 = await upgrades.deployProxy(Transalor, [currentChainIds[0], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await translator1.deployed();
    await translator1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM, chainTypes.EVM]);
    await translator1.addRelayer(owner.address);

    const translator2 = await upgrades.deployProxy(Transalor, [currentChainIds[1], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await translator2.deployed();
    await translator2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM, chainTypes.EVM]);
    await translator2.addRelayer(owner.address);

    // Initializer1 deployment
    const initializer1 = await upgrades.deployProxy(Initializer, [translator1.address], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await initializer1.deployed();

    // Initializer2 deployment
    const initializer2 = await upgrades.deployProxy(Initializer, [translator2.address], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await initializer2.deployed();

    await translator1.setInitializer(initializer1.address);
    await translator2.setInitializer(initializer2.address);

    const token1 = await Token.deploy(initializer1.address, TOKEN_AMOUNT.toString());
    await token1.deployed();
    const token2 = await Token.deploy(initializer2.address, TOKEN_AMOUNT.toString());
    await token2.deployed();
    await token1.addTrustedAddresses([currentChainIds[0], currentChainIds[1]], [token1.address, token2.address]);
    await token2.addTrustedAddresses([currentChainIds[0], currentChainIds[1]], [token1.address, token2.address]);

    const gas_sender1 = await upgrades.deployProxy(Gas, [initializer1.address], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await gas_sender1.deployed();
    const gas_sender2 = await upgrades.deployProxy(Gas, [initializer2.address], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await gas_sender2.deployed();
    const gas_sender3 = await upgrades.deployProxy(Gas, [initializer1.address], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await gas_sender3.deployed();
    await gas_sender1.addTrustedAddresses([currentChainIds[0], currentChainIds[1]], [gas_sender1.address, gas_sender2.address]);
    await gas_sender2.addTrustedAddresses([currentChainIds[0], currentChainIds[1]], [gas_sender1.address, gas_sender2.address]);

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
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = BigNumber.from(valueInUsd).mul(pow);
    expect(await token1.approve(gas_sender1.address, value.mul(2).toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(value.mul(2));
    const initial_token_balance = await token1.balanceOf(owner.address)
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [address, address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd * 2)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [address, address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd * 2)).not.to.be.reverted;

    await expect(gas_sender1.setMinUsdAmountPerChain(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [address, address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount per chain validation error");
    await expect(gas_sender1.setMinUsdAmountPerChain(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmountPerChain(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [address, address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount per chain validation error");
    await expect(gas_sender1.setMaxUsdAmountPerChain(valueInUsd)).not.to.be.reverted;

    await expect(gas_sender1.sendGas(currentChainIds, [value.toString(), value.toString()], [address, address], token1.address))
        .to.emit(gas_sender1, 'InitiateTransferEvent');
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(0);
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
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = BigNumber.from(valueInUsd).mul(pow);
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(value);
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;

    await expect(gas_sender1.setMinUsdAmountPerChain(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount per chain validation error");
    await expect(gas_sender1.setMinUsdAmountPerChain(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmountPerChain(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount per chain validation error");
    await expect(gas_sender1.setMaxUsdAmountPerChain(valueInUsd)).not.to.be.reverted;

    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
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
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(0);
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
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    let valueInUsd = 100;
    let value = BigNumber.from(valueInUsd).mul(pow);
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(value);
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;

    await expect(gas_sender1.setMinUsdAmountPerChain(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount per chain validation error");
    await expect(gas_sender1.setMinUsdAmountPerChain(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmountPerChain(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount per chain validation error");
    await expect(gas_sender1.setMaxUsdAmountPerChain(valueInUsd)).not.to.be.reverted;

    let feeValue, dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
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
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(0);
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
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
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
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(value);
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;

    await expect(gas_sender1.setMinUsdAmountPerChain(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount per chain validation error");
    await expect(gas_sender1.setMinUsdAmountPerChain(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmountPerChain(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount per chain validation error");
    await expect(gas_sender1.setMaxUsdAmountPerChain(valueInUsd)).not.to.be.reverted;

    let feeValue, dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
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
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(0);
    let capturedValue;
    await expect(gas_sender1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {capturedValue = value; return true;},
        );
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], capturedValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(gas_sender1.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(gas_sender2.address); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    await expect(translator2.transferMessage(300000, capturedValue))
        .to.emit(gas_sender2, 'PayloadReceivedEvent');
    let payloadValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint', 'uint', 'uint', 'uint'], payload.toString());
    expect(payloadValue[0]).to.equal(address);
    expect(payloadValue[1]).to.equal(value);
    expect(payloadValue[2]).to.equal(0);
    expect(payloadValue[3]).to.equal(token1.address);
    expect(payloadValue[4]).to.equal(decimals);
    let finalPayload = payload.toString() + hexRate;
    await expect(gas_sender2.asterizmClReceive(currentChainIds[0], gas_sender1.address, decodedValue[4], decodedValue[6], finalPayload)).to.not.reverted;
    expect(await(provider.getBalance(gas_sender2.address))).to.equal(beforeTxGasBalance.sub(valueInUsd * rate));
    expect(await(provider.getBalance(address))).to.equal(beforeTxUserBalance.add(valueInUsd * rate));
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(0);
    await expect(gas_sender2.asterizmClReceive(currentChainIds[0], gas_sender1.address, decodedValue[4], decodedValue[6], finalPayload))
        .to.be.revertedWith("AsterizmClient: transfer executed already");
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
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    let provider = ethers.provider;
    let beforeTxGasBalance = await(provider.getBalance(gas_sender1.address));
    let beforeTxUserBalance = await(provider.getBalance(address));
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(value);
    const initial_token_balance = await token1.balanceOf(owner.address);
    await expect(gas_sender1.setMinUsdAmount(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount validation error");
    await expect(gas_sender1.setMinUsdAmount(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmount(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount validation error");
    await expect(gas_sender1.setMaxUsdAmount(valueInUsd)).not.to.be.reverted;

    await expect(gas_sender1.setMinUsdAmountPerChain(1000)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: minimum amount per chain validation error");
    await expect(gas_sender1.setMinUsdAmountPerChain(valueInUsd)).not.to.be.reverted;
    await expect(gas_sender1.setMaxUsdAmountPerChain(1)).not.to.be.reverted;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("GasStation: maximum amount per chain validation error");
    await expect(gas_sender1.setMaxUsdAmountPerChain(valueInUsd)).not.to.be.reverted;

    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
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
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(0);
    let feeValue, PacketValue;
    await expect(gas_sender1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    // Check decoded Packet data
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], PacketValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(gas_sender1.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(gas_sender2.address); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    await expect(translator2.transferMessage(300000, PacketValue))
        .to.emit(gas_sender2, 'PayloadReceivedEvent');
    let payloadValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint', 'uint', 'uint', 'uint'], payload.toString());
    expect(payloadValue[0]).to.equal(address);
    expect(payloadValue[1]).to.equal(value);
    expect(payloadValue[2]).to.equal(0);
    expect(payloadValue[3]).to.equal(token1.address);
    expect(payloadValue[4]).to.equal(decimals);
    let finalPayload = payload.toString() + hexRate;
    await gas_sender2.asterizmClReceive(currentChainIds[0], gas_sender1.address, decodedValue[4], decodedValue[6], finalPayload);
    expect(await(provider.getBalance(gas_sender2.address))).to.equal(beforeTxGasBalance.sub(valueInUsd * rate));
    expect(await(provider.getBalance(address))).to.equal(beforeTxUserBalance.add(valueInUsd * rate));
    let wrongValue = BigNumber.from(200).mul(pow);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(0);

    beforeTxGasBalance = await(provider.getBalance(gas_sender2.address));
    beforeTxUserBalance = await(provider.getBalance(address));
    expect(await token1.approve(gas_sender1.address, value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(value);
    await expect(gas_sender1.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
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
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(0);
    await expect(gas_sender1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    // Check decoded Packet data
    decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], PacketValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(gas_sender1.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(gas_sender2.address); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(1); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    await expect(translator2.transferMessage(300000, PacketValue))
        .to.emit(gas_sender2, 'PayloadReceivedEvent');
    payloadValue = ethers.utils.defaultAbiCoder.decode(['uint', 'uint', 'uint', 'uint', 'uint'], payload.toString());
    expect(payloadValue[0]).to.equal(address);
    expect(payloadValue[1]).to.equal(value);
    expect(payloadValue[2]).to.equal(1);
    expect(payloadValue[3]).to.equal(token1.address);
    expect(payloadValue[4]).to.equal(decimals);
    finalPayload = payload.toString() + hexRate;
    await gas_sender2.asterizmClReceive(currentChainIds[0], gas_sender1.address, decodedValue[4], decodedValue[6], finalPayload);
    expect(await(provider.getBalance(gas_sender2.address))).to.equal(beforeTxGasBalance.sub(valueInUsd * rate));
    expect(await(provider.getBalance(address))).to.equal(beforeTxUserBalance.add(valueInUsd * rate));
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(0);
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
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    expect(await token1.approve(gas_sender3.address, value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, gas_sender3.address)).to.equal(value);
    const initial_token_balance = await token1.balanceOf(owner.address);
    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender3.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("AsterizmClient: trusted address not found");
    await gas_sender3.addTrustedAddress(currentChainIds[1], gas_sender2.address);
    await expect(gas_sender3.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
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
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender1.address)).to.equal(0);
    let feeValue, PacketValue;
    await expect(gas_sender3.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    // Check decoded Packet data
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], PacketValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(gas_sender3.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(gas_sender2.address); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
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
    expect(psSrcAddress).to.equal(gas_sender3.address);
    expect(psDstChainId).to.equal(currentChainIds[1]);
    expect(psDstAddress).to.equal(gas_sender2.address);
    expect(psTransferHash).not.null;
    expect(ethers.utils.defaultAbiCoder.decode(['string'], psReason.toString())[0]).to.equal('AsterizmClient: wrong source address');
  });
  it("Should revert transfers with outbound transfer errors", async function () {
    let valueInUsd = 100;
    let address = "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168";
    const failedTransferHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
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
    const ownerTokenBalanceBefore = await token1.balanceOf(owner.address);
    expect(await token1.approve(gas_sender3.address, value.toString())).not.to.be.reverted;
    expect(await token1.allowance(owner.address, gas_sender3.address)).to.equal(value);
    const initial_token_balance = await token1.balanceOf(owner.address);
    let dstChainId, dstAddress, txId, transferHash, payload, gasDstChainId, gasTxId, gasPayload;
    await expect(gas_sender3.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
        .to.be.revertedWith("AsterizmClient: trusted address not found");
    await gas_sender3.addTrustedAddress(currentChainIds[1], gas_sender2.address);
    await expect(gas_sender3.sendGas([currentChainIds[1]], [value.toString()], [address], token1.address))
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
    expect(dstAddress).to.equal(gas_sender2.address);
    expect(txId).to.not.null;
    expect(gasTxId).to.not.null;
    expect(txId).to.equal(gasTxId);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(gasPayload).to.not.null;
    expect(payload).to.equal(gasPayload);
    expect(await token1.balanceOf(owner.address)).to.equal(ownerTokenBalanceBefore);
    expect(await token1.allowance(owner.address, gas_sender3.address)).to.equal(0);
    let feeValue, PacketValue;
    await expect(gas_sender3.initAsterizmTransfer(dstChainId, txId, failedTransferHash)).to.be
        .revertedWith("AsterizmClient: outbound transfer not exists");
    await expect(gas_sender3.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {PacketValue = value; return true;},
        );
    // Check decoded Packet data
    let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], PacketValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(gas_sender3.address); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(gas_sender2.address); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(txId); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    await expect(gas_sender3.initAsterizmTransfer(dstChainId, txId, transferHash)).to.be
        .revertedWith("AsterizmClient: outbound transfer executed already");
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
