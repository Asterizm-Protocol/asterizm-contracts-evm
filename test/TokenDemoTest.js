const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const bigInt = require("big-integer");

const pow = bigInt(10).pow(18);
const TOKEN_AMOUNT = bigInt('1000000').multiply(pow.toString());

describe("Token contract test", function () {
  async function deployContractsFixture() {
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
    const Token = await ethers.getContractFactory("OmniChainToken");
    const Claimer = await ethers.getContractFactory("Claimer");
    const [owner] = await ethers.getSigners();
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

    const claimer1 = await Claimer.deploy(await token1.getAddress());
    await claimer1.waitForDeployment();
    const claimer2 = await Claimer.deploy(await token2.getAddress());
    await claimer2.waitForDeployment();

    // Fixtures can return anything you consider useful for your tests
    return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Claimer, claimer1, claimer2, owner, currentChainIds};
  }

  it("Should successfuly deploy contracts", async function () {
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Claimer, claimer1, claimer2, owner } = await loadFixture(deployContractsFixture);
  });

  it("Should claim token", async function () {
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    const value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Claimer, claimer1, claimer2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, address, value))
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
    expect(await token1.balanceOf(owner.address)).to.equal(TOKEN_AMOUNT.subtract(value).toString());
    await expect(translator2.transferMessage(300000, packetValue))
        .to.emit(token2, 'PayloadReceivedEvent');
    await expect(token2.asterizmClReceive(currentChainIds[0], await token1.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
    expect(await token1.balanceOf(owner.address)).to.equal(TOKEN_AMOUNT.subtract(value).toString());
    expect(await token2.balanceOf(address)).to.equal(value);
    expect(await token1.totalSupply()).to.equal(TOKEN_AMOUNT.subtract(value).toString());
    expect(await token2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value).toString());
    await token1.transfer(await claimer1.getAddress(), await token1.balanceOf(owner.address));
    const amounts = [20];
    await expect(claimer1.claim([currentChainIds[1]], amounts))
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
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(token1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {packetValue = value; return true;},
        );
  });

  it("Should claim and send token", async function () {
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    const value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Claimer, claimer1, claimer2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, address, value))
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
    expect(await token1.balanceOf(owner.address)).to.equal(TOKEN_AMOUNT.subtract(value).toString());
    await expect(translator2.transferMessage(300000, packetValue))
        .to.emit(token2, 'PayloadReceivedEvent');
    await expect(token2.asterizmClReceive(currentChainIds[0], await token1.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
    expect(await token2.balanceOf(owner.address)).to.equal(TOKEN_AMOUNT.toString());
    expect(await token2.balanceOf(address)).to.equal(
      value
    );
    expect(await token2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value).toString());
    await token1.transfer(await claimer1.getAddress(), await token1.balanceOf(owner.address));

    const amounts = [10];
    await expect(await claimer1.claim([currentChainIds[1]], amounts))
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
    expect(txId).to.equal(1);
    expect(transferHash).to.not.null;
    expect(payload).to.not.null;
    await expect(token1.initAsterizmTransfer(dstChainId, txId, transferHash))
        .to.emit(translator1, 'SendMessageEvent')
        .withArgs(
            (value) => {feeValue = value; return true;},
            (value) => {packetValue = value; return true;},
        );
    await translator2.transferMessage(300000, packetValue);
    expect(await token2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value).toString());
    expect(await token2.balanceOf(owner.address)).to.equal(TOKEN_AMOUNT.toString());
  });

  it("Should claim, send and receive token", async function () {
    let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
    const address = '0x89F5C7d4580065fd9135Eff13493AaA5ad10A168';
    const value = 100;
    const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, Claimer, claimer1, claimer2, owner, currentChainIds } = await loadFixture(deployContractsFixture);
    await expect(token1.crossChainTransfer(currentChainIds[1], owner.address, address, value))
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
    expect(await token1.balanceOf(owner.address)).to.equal(TOKEN_AMOUNT.subtract(value).toString());
    await expect(translator2.transferMessage(300000, packetValue))
        .to.emit(token2, 'PayloadReceivedEvent');
    await expect(token2.asterizmClReceive(currentChainIds[0], await token1.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
    expect(await token2.balanceOf(owner.address)).to.equal(TOKEN_AMOUNT.toString());
    expect(await token2.balanceOf(address)).to.equal(
        value
    );
    expect(await token2.totalSupply()).to.equal(TOKEN_AMOUNT.add(value).toString());
    await token1.transfer(await claimer1.getAddress(), await token1.balanceOf(owner.address));


    const amounts = [10,20,30];
    await expect(await claimer1.claim(currentChainIds, amounts)).not.to.be.reverted;
  });

});
