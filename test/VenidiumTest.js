const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const {BigNumber} = require("ethers");

let decimals = 18;
let pow = BigNumber.from(10).pow(decimals);
const TOKEN_AMOUNT = BigNumber.from(1000000).mul(pow);

describe("Venidium logic", function () {
    async function deployContractsFixture() {
        const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
        const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
        const Token = await ethers.getContractFactory("MultichainToken");
        const TokenNativeSrc = await ethers.getContractFactory("NativeSrcMultichainUpgradeableV1");
        const TokenNativeDst = await ethers.getContractFactory("NativeDstMultichainUpgradeableV1");
        const TokenStableSrc = await ethers.getContractFactory("StableSrcMultichainUpgradeableV1");
        const TokenStableDst = await ethers.getContractFactory("StableDstMultichainUpgradeableV1");
        const TokenUpgrade = await ethers.getContractFactory("MultiChainTokenUpgradeableV1");
        const Gas = await ethers.getContractFactory("GasStationUpgradeableV1");
        const [owner, user] = await ethers.getSigners();
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
        const token2 = await Token.deploy(initializer1.address, TOKEN_AMOUNT.toString());
        await token2.deployed();
        const tokenNativeSrc = await upgrades.deployProxy(TokenNativeSrc, [initializer1.address, '0', decimals, token1.address], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await tokenNativeSrc.deployed();
        const tokenNativeDst = await upgrades.deployProxy(TokenNativeDst, [initializer2.address, '0', decimals], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await tokenNativeDst.deployed();
        await tokenNativeSrc.addTrustedAddresses(currentChainIds, [tokenNativeSrc.address, tokenNativeDst.address]);
        await tokenNativeDst.addTrustedAddresses(currentChainIds, [tokenNativeSrc.address, tokenNativeDst.address]);
        const tokenStableSrc = await upgrades.deployProxy(TokenStableSrc, [initializer1.address, '0', decimals, token2.address], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await tokenStableSrc.deployed();
        const tokenStableDst = await upgrades.deployProxy(TokenStableDst, [initializer2.address, '0', decimals], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await tokenStableDst.deployed();
        await tokenStableSrc.addTrustedAddresses(currentChainIds, [tokenStableSrc.address, tokenStableDst.address]);
        await tokenStableDst.addTrustedAddresses(currentChainIds, [tokenStableSrc.address, tokenStableDst.address]);

        // Fixtures can return anything you consider useful for your tests
        return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, currentChainIds};
    }

    it("Should successfuly deploy contracts", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    });
    it("Check address balances", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
        let balance = await(token1.balanceOf(owner.address));
        expect(await token1.balanceOf(owner.address)).to.equal(
            TOKEN_AMOUNT.toString()
        );
    });
    it("Check address balances", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
        let balance = await(token1.balanceOf(owner.address));
        expect(await token1.balanceOf(owner.address)).to.equal(
            TOKEN_AMOUNT.toString()
        );
    });
    it("Should stake tokens and then send coins with native logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
        let value = 10;
        let valueWithDecimals = BigNumber.from(value).mul(pow);
        let startUserNativeBalance = await ethers.provider.getBalance(user.address);
        expect(await owner.sendTransaction({
            to: tokenNativeDst.address,
            value: ethers.utils.parseEther("100"),
        })).not.to.be.reverted;
        expect(await token1.approve(tokenNativeSrc.address, valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenNativeSrc.crossChainTransfer(currentChainIds[1], owner.address, user.address, valueWithDecimals))
            .to.emit(tokenNativeSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(tokenNativeDst.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token1.balanceOf(tokenNativeSrc.address)).to.equal(valueWithDecimals);
        let feeValue, packetValue;
        await expect(tokenNativeSrc.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(tokenNativeSrc.address); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(tokenNativeDst.address); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(tokenNativeDst, 'PayloadReceivedEvent');
        await expect(tokenNativeDst.asterizmClReceive(currentChainIds[0], tokenNativeSrc.address, decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await ethers.provider.getBalance(user.address)).to.equal(startUserNativeBalance.add(valueWithDecimals));
    });
    it("Should stake tokens and send coins, than stake coins and send tokens with native logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
        const value = 10;
        const valueWithDecimals = BigNumber.from(value).mul(pow);
        const startUserNativeBalance = await ethers.provider.getBalance(user.address);
        expect(await owner.sendTransaction({
            to: tokenNativeDst.address,
            value: ethers.utils.parseEther("100"),
        })).not.to.be.reverted;
        expect(await token1.approve(tokenNativeSrc.address, valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenNativeSrc.crossChainTransfer(currentChainIds[1], owner.address, user.address, valueWithDecimals))
            .to.emit(tokenNativeSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(tokenNativeDst.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token1.balanceOf(tokenNativeSrc.address)).to.equal(valueWithDecimals);
        let feeValue, packetValue;
        await expect(tokenNativeSrc.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(tokenNativeSrc.address); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(tokenNativeDst.address); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(tokenNativeDst, 'PayloadReceivedEvent');
        await expect(tokenNativeDst.asterizmClReceive(currentChainIds[0], tokenNativeSrc.address, decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await ethers.provider.getBalance(user.address)).to.equal(startUserNativeBalance.add(valueWithDecimals));


        const startUserTokenBalance = await token1.balanceOf(user.address);
        const startContractCoinBalance = await ethers.provider.getBalance(tokenNativeDst.address);
        const startContractTokenBalance = await token1.balanceOf(tokenNativeSrc.address);
        await expect(tokenNativeDst.crossChainTransfer(currentChainIds[0], user.address, user.address, valueWithDecimals, {value: valueWithDecimals}))
            .to.emit(tokenNativeDst, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[0]);
        expect(dstAddress).to.equal(tokenNativeSrc.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await ethers.provider.getBalance(tokenNativeDst.address)).to.equal(startContractCoinBalance.add(valueWithDecimals));
        await expect(tokenNativeDst.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator2, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[1]); // srcChainId
        expect(decodedValue[1]).to.equal(tokenNativeDst.address); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[0]); // dstChainId
        expect(decodedValue[3]).to.equal(tokenNativeSrc.address); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator1.transferMessage(300000, packetValue))
            .to.emit(tokenNativeSrc, 'PayloadReceivedEvent');
        await expect(tokenNativeSrc.asterizmClReceive(currentChainIds[1], tokenNativeDst.address, decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await token1.balanceOf(tokenNativeSrc.address)).to.equal(startContractTokenBalance.sub(valueWithDecimals));
        expect(await token1.balanceOf(user.address)).to.equal(startUserTokenBalance.add(valueWithDecimals));
    });

    it("Should stake tokens and then mint tokens with stable logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
        let value = 10;
        let valueWithDecimals = BigNumber.from(value).mul(pow);
        let startOwnerTokenBalance = await token2.balanceOf(owner.address);
        expect(await token2.approve(tokenStableSrc.address, valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenStableSrc.crossChainTransfer(currentChainIds[1], owner.address, owner.address, valueWithDecimals))
            .to.emit(tokenStableSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(tokenStableDst.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token2.balanceOf(owner.address)).to.equal(startOwnerTokenBalance.sub(valueWithDecimals));
        expect(await token2.balanceOf(tokenStableSrc.address)).to.equal(valueWithDecimals);
        let feeValue, packetValue;
        await expect(tokenStableSrc.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(tokenStableSrc.address); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(tokenStableDst.address); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(tokenStableDst, 'PayloadReceivedEvent');
        await expect(tokenStableDst.asterizmClReceive(currentChainIds[0], tokenStableSrc.address, decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await tokenStableDst.balanceOf(owner.address)).to.equal(valueWithDecimals);
        expect(await tokenStableDst.totalSupply()).to.equal(valueWithDecimals);
    });
    it("Should stake tokens and mint tokens, than burn tokens and send tokens with stable logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
        let value = 10;
        let valueWithDecimals = BigNumber.from(value).mul(pow);
        let startOwnerTokenBalance = await token2.balanceOf(owner.address);
        expect(await token2.approve(tokenStableSrc.address, valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenStableSrc.crossChainTransfer(currentChainIds[1], owner.address, owner.address, valueWithDecimals))
            .to.emit(tokenStableSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(tokenStableDst.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token2.balanceOf(owner.address)).to.equal(startOwnerTokenBalance.sub(valueWithDecimals));
        expect(await token2.balanceOf(tokenStableSrc.address)).to.equal(valueWithDecimals);
        let feeValue, packetValue;
        await expect(tokenStableSrc.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(tokenStableSrc.address); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(tokenStableDst.address); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(tokenStableDst, 'PayloadReceivedEvent');
        await expect(tokenStableDst.asterizmClReceive(currentChainIds[0], tokenStableSrc.address, decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await tokenStableDst.balanceOf(owner.address)).to.equal(valueWithDecimals);
        expect(await tokenStableDst.totalSupply()).to.equal(valueWithDecimals);


        const startOwnerStableTokenBalance = await token2.balanceOf(owner.address);
        const startContractStableTokenBalance = await token2.balanceOf(tokenStableSrc.address);
        await expect(tokenStableDst.crossChainTransfer(currentChainIds[0], owner.address, owner.address, valueWithDecimals, {value: valueWithDecimals}))
            .to.emit(tokenStableDst, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[0]);
        expect(dstAddress).to.equal(tokenStableSrc.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await tokenStableDst.balanceOf(owner.address)).to.equal('0');
        expect(await tokenStableDst.totalSupply()).to.equal('0');
        await expect(tokenStableDst.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator2, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        decodedValue = ethers.utils.defaultAbiCoder.decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[1]); // srcChainId
        expect(decodedValue[1]).to.equal(tokenStableDst.address); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[0]); // dstChainId
        expect(decodedValue[3]).to.equal(tokenStableSrc.address); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator1.transferMessage(300000, packetValue))
            .to.emit(tokenStableSrc, 'PayloadReceivedEvent');
        await expect(tokenStableSrc.asterizmClReceive(currentChainIds[1], tokenStableDst.address, decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await token2.balanceOf(tokenStableSrc.address)).to.equal(startContractStableTokenBalance.sub(valueWithDecimals));
        expect(await token2.balanceOf(owner.address)).to.equal(startOwnerStableTokenBalance.add(valueWithDecimals));
    });
    it("Should not withdrawal tokens with native logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
        let value = 10;
        let valueWithDecimals = BigNumber.from(value).mul(pow);
        expect(await token1.approve(tokenNativeSrc.address, valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenNativeSrc.crossChainTransfer(currentChainIds[1], owner.address, user.address, valueWithDecimals))
            .to.emit(tokenNativeSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(tokenNativeDst.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token1.balanceOf(tokenNativeSrc.address)).to.equal(valueWithDecimals);
        await expect(tokenNativeSrc.withdrawTokens(token1.address, owner.address, valueWithDecimals))
            .to.be.revertedWith("AsterizmWithdrawal: tokens withdrawal is disabled");
    });
    it("Should not withdrawal tokens with stable logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
        let value = 10;
        let valueWithDecimals = BigNumber.from(value).mul(pow);
        expect(await token2.approve(tokenStableSrc.address, valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenStableSrc.crossChainTransfer(currentChainIds[1], owner.address, user.address, valueWithDecimals))
            .to.emit(tokenStableSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(tokenStableDst.address);
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token2.balanceOf(tokenStableSrc.address)).to.equal(valueWithDecimals);
        await expect(tokenStableSrc.withdrawTokens(token2.address, owner.address, valueWithDecimals))
            .to.be.revertedWith("AsterizmWithdrawal: tokens withdrawal is disabled");
    });
});
