const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const bigInt = require("big-integer");

const pow = bigInt(10).pow(18);
const TOKEN_AMOUNT = bigInt('1000000').multiply(pow.toString());

describe("Crosschain token", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
    const Token = await ethers.getContractFactory("MultichainToken");
    const TokenUpgrade = await ethers.getContractFactory("MultiChainTokenUpgradeableV1");
    const Gas = await ethers.getContractFactory("GasStationUpgradeableV1");
    const [owner, user] = await ethers.getSigners();
    const currentChainIds = [1, 2];
    const chainTypes = {EVM: 1, TVM: 2};

    const translator1 = await upgrades.deployProxy(Transalor, [currentChainIds[0], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await translator1.waitForDeployment();
    await translator1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
    await translator1.addRelayer(owner.address);

    const translator2 = await upgrades.deployProxy(Transalor, [currentChainIds[1], chainTypes.EVM], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await translator2.waitForDeployment();
    await translator2.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
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
    await token1.addTrustedAddresses(currentChainIds, [await token1.getAddress(), await token2.getAddress()]);
    await token2.addTrustedAddresses(currentChainIds, [await token1.getAddress(), await token2.getAddress()]);
    const tokenUpgrade1 = await upgrades.deployProxy(TokenUpgrade, [await initializer1.getAddress(), TOKEN_AMOUNT.toString()], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await tokenUpgrade1.waitForDeployment();
    const tokenUpgrade2 = await upgrades.deployProxy(TokenUpgrade, [await initializer2.getAddress(), TOKEN_AMOUNT.toString()], {
      initialize: 'initialize',
      kind: 'uups',
    });
    await tokenUpgrade2.waitForDeployment();
    await tokenUpgrade1.addTrustedAddresses(currentChainIds, [await tokenUpgrade1.getAddress(), await tokenUpgrade2.getAddress()]);
    await tokenUpgrade2.addTrustedAddresses(currentChainIds, [await tokenUpgrade1.getAddress(), await tokenUpgrade2.getAddress()]);

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
    await gas_sender1.addTrustedAddresses(currentChainIds, [await gas_sender1.getAddress(), await gas_sender2.getAddress()]);
    await gas_sender2.addTrustedAddresses(currentChainIds, [await gas_sender1.getAddress(), await gas_sender2.getAddress()]);

    // Fixtures can return anything you consider useful for your tests
    return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds};
  }

  it("Should successfuly deploy contracts", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
  });
  it("Check address balances", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    let balance = await(token1.balanceOf(owner.address));
    expect(await token1.balanceOf(owner.address)).to.equal(
      TOKEN_AMOUNT.toString()
    );
  });
  it("Check address balances", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    let balance = await(token1.balanceOf(owner.address));
    expect(await token1.balanceOf(owner.address)).to.equal(
      TOKEN_AMOUNT.toString()
    );
  });
  it("Should emit event from Translator", async function () {
    let dstChainId, dstAddress, txId, transferHash, payload;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
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
    expect(dstAddress).to.equal(await token2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(token1.initAsterizmTransfer(dstChainId, txId, transferHash))
      .to.emit(translator1, 'SendMessageEvent');
  });
  it("Should burn token", async function () {
    let dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
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
    expect(dstAddress).to.equal(await token2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(token1.initAsterizmTransfer(dstChainId, txId, transferHash))
      .to.emit(translator1, 'SendMessageEvent');
    expect(await token1.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT.subtract(value).toString())
    );
    expect(await token1.totalSupply()).to.equal(
      (TOKEN_AMOUNT.subtract(value).toString())
    );
  });
  it("Should burn and then mint token", async function () {
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, user.address, value))
        .to.emit(token1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await token2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(token1.initAsterizmTransfer(dstChainId, txId, transferHash))
      .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {packetValue = value; return true;},
        );
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await token1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await token2.getAddress()); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await token1.balanceOf(owner.address)).to.equal(
        (TOKEN_AMOUNT.subtract(value).toString())
    );
    await expect(translator2.transferMessage(300000, packetValue))
        .to.emit(token2, 'PayloadReceivedEvent');
    await expect(token2.asterizmClReceive(currentChainIds[0], await token1.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
    expect(await token1.balanceOf(owner.address)).to.equal(
      (TOKEN_AMOUNT.subtract(value).toString())
    );
    expect(await token2.balanceOf(user.address)).to.equal(
        value
    );
    expect(await token1.totalSupply()).to.equal(TOKEN_AMOUNT.subtract(value).toString());
    expect(await token2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value).toString());
  });

  it("Should emit event from Translator (upgradeable tokens)", async function () {
    let dstChainId, dstAddress, txId, transferHash, payload;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(tokenUpgrade1.crossChainTransfer(currentChainIds[1], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", 100))
        .to.emit(tokenUpgrade1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await tokenUpgrade2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(tokenUpgrade1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent');
  });
  it("Should burn token (upgradeable tokens)", async function () {
    let dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(tokenUpgrade1.crossChainTransfer(currentChainIds[1], owner.address, "0x89F5C7d4580065fd9135Eff13493AaA5ad10A168", value))
        .to.emit(tokenUpgrade1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await tokenUpgrade2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(tokenUpgrade1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent');
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(
        (TOKEN_AMOUNT.subtract(value).toString())
    );
    expect(await tokenUpgrade1.totalSupply()).to.equal(
        (TOKEN_AMOUNT.subtract(value).toString())
    );
  });
  it("Should burn and then mint token", async function () {
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(tokenUpgrade1.crossChainTransfer(currentChainIds[1], owner.address, user.address, value))
        .to.emit(tokenUpgrade1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await tokenUpgrade2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(tokenUpgrade1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {packetValue = value; return true;},
        );
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await tokenUpgrade1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await tokenUpgrade2.getAddress()); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(
        (TOKEN_AMOUNT.subtract(value).toString())
    );
    await expect(translator2.transferMessage(300000, packetValue))
        .to.emit(tokenUpgrade2, 'PayloadReceivedEvent');
    await expect(tokenUpgrade2.asterizmClReceive(currentChainIds[0], await tokenUpgrade1.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(
        (TOKEN_AMOUNT.subtract(value).toString())
    );
    expect(await tokenUpgrade2.balanceOf(user.address)).to.equal(
        value
    );
    expect(await tokenUpgrade1.totalSupply()).to.equal(TOKEN_AMOUNT.subtract(value).toString());
    expect(await tokenUpgrade2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value).toString());
  });
  it("Should refund tokens successfully", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const startOwnerTokenBalance = bigInt(await tokenUpgrade1.balanceOf(owner.address));
    await expect(tokenUpgrade1.crossChainTransfer(currentChainIds[1], owner.address, user.address, value))
        .to.emit(tokenUpgrade1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await tokenUpgrade2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(startOwnerTokenBalance.subtract(value).toString());

    let refundTransferHash, refundUserAddress, refundAmount, refundTokenAddress;
    await expect(tokenUpgrade1.addRefundRequest(transferHash))
        .to.emit(tokenUpgrade1, 'AddRefundRequestEvent')
        .withArgs(
            (value) => {refundTransferHash = value; return true;},
            (value) => {refundUserAddress = value; return true;},
            (value) => {refundAmount = value; return true;},
            (value) => {refundTokenAddress = value; return true;},
        );
    expect(refundTransferHash).to.equal(transferHash);
    expect(refundUserAddress).to.equal(owner.address);
    expect(refundAmount).to.equal(value);
    expect(refundTokenAddress).to.equal(await tokenUpgrade1.getAddress());

    const beforeProcessOwnerTokenBalance = bigInt(await tokenUpgrade1.balanceOf(owner.address));
    let requestTransferHash, requestStatus;
    await expect(tokenUpgrade1.processRefundRequest(transferHash, true))
        .to.emit(tokenUpgrade1, 'ProcessRefundRequestEvent')
        .withArgs(
            (value) => {requestTransferHash = value; return true;},
            (value) => {requestStatus = value; return true;},
        );
    expect(refundTransferHash).to.equal(transferHash);
    expect(requestStatus).to.equal(true);
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(beforeProcessOwnerTokenBalance.add(value).toString());
  });
  it("Should not refund tokens with rejected request", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const startOwnerTokenBalance = bigInt(await tokenUpgrade1.balanceOf(owner.address));
    await expect(tokenUpgrade1.crossChainTransfer(currentChainIds[1], owner.address, user.address, value))
        .to.emit(tokenUpgrade1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await tokenUpgrade2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(startOwnerTokenBalance.subtract(value).toString());

    let refundTransferHash, refundUserAddress, refundAmount, refundTokenAddress;
    await expect(tokenUpgrade1.addRefundRequest(transferHash))
        .to.emit(tokenUpgrade1, 'AddRefundRequestEvent')
        .withArgs(
            (value) => {refundTransferHash = value; return true;},
            (value) => {refundUserAddress = value; return true;},
            (value) => {refundAmount = value; return true;},
            (value) => {refundTokenAddress = value; return true;},
        );
    expect(refundTransferHash).to.equal(transferHash);
    expect(refundUserAddress).to.equal(owner.address);
    expect(refundAmount).to.equal(value);
    expect(refundTokenAddress).to.equal(await tokenUpgrade1.getAddress());

    const beforeProcessOwnerTokenBalance = await tokenUpgrade1.balanceOf(owner.address);
    let requestTransferHash, requestStatus;
    await expect(tokenUpgrade1.processRefundRequest(transferHash, false))
        .to.emit(tokenUpgrade1, 'ProcessRefundRequestEvent')
        .withArgs(
            (value) => {requestTransferHash = value; return true;},
            (value) => {requestStatus = value; return true;},
        );
    expect(refundTransferHash).to.equal(transferHash);
    expect(requestStatus).to.equal(false);
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(beforeProcessOwnerTokenBalance);
  });
  it("Should refund tokens successfully with refundFee", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const refundFee = 1000000;
    expect(await tokenUpgrade1.setRefundFee(refundFee)).not.to.be.reverted;
    const startOwnerTokenBalance = bigInt(await tokenUpgrade1.balanceOf(owner.address));
    await expect(tokenUpgrade1.crossChainTransfer(currentChainIds[1], owner.address, user.address, value))
        .to.emit(tokenUpgrade1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await tokenUpgrade2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(startOwnerTokenBalance.subtract(value).toString());

    let refundTransferHash, refundUserAddress, refundAmount, refundTokenAddress;
    await expect(tokenUpgrade1.addRefundRequest(transferHash))
        .to.be.revertedWith("AR: small value");
    await expect(tokenUpgrade1.addRefundRequest(transferHash, {value: refundFee}))
        .to.emit(tokenUpgrade1, 'AddRefundRequestEvent')
        .withArgs(
            (value) => {refundTransferHash = value; return true;},
            (value) => {refundUserAddress = value; return true;},
            (value) => {refundAmount = value; return true;},
            (value) => {refundTokenAddress = value; return true;},
        );
    expect(refundTransferHash).to.equal(transferHash);
    expect(refundUserAddress).to.equal(owner.address);
    expect(refundAmount).to.equal(value);
    expect(refundTokenAddress).to.equal(await tokenUpgrade1.getAddress());

    const beforeProcessOwnerTokenBalance = bigInt(await tokenUpgrade1.balanceOf(owner.address));
    let requestTransferHash, requestStatus;
    await expect(tokenUpgrade1.processRefundRequest(transferHash, true))
        .to.emit(tokenUpgrade1, 'ProcessRefundRequestEvent')
        .withArgs(
            (value) => {requestTransferHash = value; return true;},
            (value) => {requestStatus = value; return true;},
        );
    expect(refundTransferHash).to.equal(transferHash);
    expect(requestStatus).to.equal(true);
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(beforeProcessOwnerTokenBalance.add(value).toString());
  });
  it("Should reject refunded transfer in src chain", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const refundFee = 1000000;
    expect(await tokenUpgrade1.setRefundFee(refundFee)).not.to.be.reverted;
    const startOwnerTokenBalance = bigInt(await tokenUpgrade1.balanceOf(owner.address));
    await expect(tokenUpgrade1.crossChainTransfer(currentChainIds[1], owner.address, user.address, value))
        .to.emit(tokenUpgrade1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await tokenUpgrade2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(startOwnerTokenBalance.subtract(value).toString());

    let refundTransferHash, refundUserAddress, refundAmount, refundTokenAddress;
    await expect(tokenUpgrade1.addRefundRequest(transferHash))
        .to.be.revertedWith("AR: small value");
    await expect(tokenUpgrade1.addRefundRequest(transferHash, {value: refundFee}))
        .to.emit(tokenUpgrade1, 'AddRefundRequestEvent')
        .withArgs(
            (value) => {refundTransferHash = value; return true;},
            (value) => {refundUserAddress = value; return true;},
            (value) => {refundAmount = value; return true;},
            (value) => {refundTokenAddress = value; return true;},
        );
    expect(refundTransferHash).to.equal(transferHash);
    expect(refundUserAddress).to.equal(owner.address);
    expect(refundAmount).to.equal(value);
    expect(refundTokenAddress).to.equal(await tokenUpgrade1.getAddress());

    await expect(tokenUpgrade1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.be.revertedWith("AR: transfer was refunded");
  });
  it("Should reject refunded transfer in dst chain", async function () {
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    let value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenUpgrade, tokenUpgrade1, tokenUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(tokenUpgrade1.crossChainTransfer(currentChainIds[1], owner.address, user.address, value))
        .to.emit(tokenUpgrade1, 'InitiateTransferEvent')
        .withArgs(
            (value) => {dstChainId = value; return true;},
            (value) => {dstAddress = value; return true;},
            (value) => {txId = value; return true;},
            (value) => {transferHash = value; return true;},
            (value) => {payload = value; return true;},
        );
    expect(dstChainId).to.equal(currentChainIds[1]);
    expect(dstAddress).to.equal(await tokenUpgrade2.getAddress());
    expect(txId).to.equal(0);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(tokenUpgrade1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {packetValue = value; return true;},
        );
    let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
    expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
    expect(decodedValue[1]).to.equal(await tokenUpgrade1.getAddress()); // srcAddress
    expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
    expect(decodedValue[3]).to.equal(await tokenUpgrade2.getAddress()); // dstAddress
    expect(feeValue).to.equal(0); // feeValue
    expect(decodedValue[4]).to.equal(0); // txId
    expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
    expect(decodedValue[6]).to.equal(transferHash); // transferHash
    expect(await tokenUpgrade1.balanceOf(owner.address)).to.equal(
        (TOKEN_AMOUNT.subtract(value).toString())
    );
    await expect(translator2.transferMessage(300000, packetValue))
        .to.emit(tokenUpgrade2, 'PayloadReceivedEvent');
    expect(await tokenUpgrade2.confirmRefund(transferHash)).not.to.be.reverted;

    await expect(tokenUpgrade2.asterizmClReceive(currentChainIds[0], await tokenUpgrade1.getAddress(), decodedValue[4], decodedValue[6], payload))
        .to.be.revertedWith("AR: transfer was refunded");
  });
});
