const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const bigInt = require("big-integer");

let decimals = 18;
const pow = bigInt(10).pow(decimals);
const TOKEN_AMOUNT = bigInt('1000000').multiply(pow.toString());

describe("Venidium logic", function () {
    async function deployContractsFixture() {
        const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
        const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
        const Token = await ethers.getContractFactory("OmniChainToken");
        const TokenNativeSrc = await ethers.getContractFactory("NativeSrcMultichainUpgradeableV1");
        const TokenNativeDst = await ethers.getContractFactory("NativeDstMultichainUpgradeableV1");
        const TokenStableSrc = await ethers.getContractFactory("StableSrcMultichainUpgradeableV1");
        const TokenStableDst = await ethers.getContractFactory("StableDstMultichainUpgradeableV1");
        const [owner, user, feeBaseUser, feeProviderUser] = await ethers.getSigners();
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
        const token2 = await Token.deploy(await initializer1.getAddress(), TOKEN_AMOUNT.toString());
        await token2.waitForDeployment();
        const tokenNativeSrc = await upgrades.deployProxy(TokenNativeSrc, [await initializer1.getAddress(), '0', decimals, await token1.getAddress(), feeBaseUser.address], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await tokenNativeSrc.waitForDeployment();
        const tokenNativeDst = await upgrades.deployProxy(TokenNativeDst, [await initializer2.getAddress(), '0', decimals, feeBaseUser.address], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await tokenNativeDst.waitForDeployment();
        await tokenNativeSrc.addTrustedAddresses(currentChainIds, [await tokenNativeSrc.getAddress(), await tokenNativeDst.getAddress()]);
        await tokenNativeDst.addTrustedAddresses(currentChainIds, [await tokenNativeSrc.getAddress(), await tokenNativeDst.getAddress()]);
        const tokenStableSrc = await upgrades.deployProxy(TokenStableSrc, [await initializer1.getAddress(), '0', decimals, await token2.getAddress(), feeBaseUser.address], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await tokenStableSrc.waitForDeployment();
        const tokenStableDst = await upgrades.deployProxy(TokenStableDst, [await initializer2.getAddress(), '0', decimals, feeBaseUser.address], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await tokenStableDst.waitForDeployment();
        await tokenStableSrc.addTrustedAddresses(currentChainIds, [await tokenStableSrc.getAddress(), await tokenStableDst.getAddress()]);
        await tokenStableDst.addTrustedAddresses(currentChainIds, [await tokenStableSrc.getAddress(), await tokenStableDst.getAddress()]);

        // Fixtures can return anything you consider useful for your tests
        return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds};
    }

    it("Should successfuly deploy contracts", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
    });
    it("Check address balances", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
        let balance = await(token1.balanceOf(owner.address));
        expect(await token1.balanceOf(owner.address)).to.equal(
            TOKEN_AMOUNT.toString()
        );
    });
    it("Check address balances", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
        let balance = await(token1.balanceOf(owner.address));
        expect(await token1.balanceOf(owner.address)).to.equal(
            TOKEN_AMOUNT.toString()
        );
    });
    it("Should stake tokens and then send coins with native logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
        let value = 10;
        let valueWithDecimals = bigInt(value).multiply(pow.toString());
        let startUserNativeBalance = bigInt(await ethers.provider.getBalance(user.address));
        expect(await owner.sendTransaction({
            to: await tokenNativeDst.getAddress(),
            value: bigInt(100).multiply(pow.toString()).toString(),
        })).not.to.be.reverted;
        expect(await token1.approve(await tokenNativeSrc.getAddress(), valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenNativeSrc.crossChainTransfer(currentChainIds[1], owner.address, user.address, valueWithDecimals.toString()))
            .to.emit(tokenNativeSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await tokenNativeDst.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token1.balanceOf(await tokenNativeSrc.getAddress())).to.equal(valueWithDecimals.toString());
        let feeValue, packetValue;
        await expect(tokenNativeSrc.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(await tokenNativeSrc.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(await tokenNativeDst.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(tokenNativeDst, 'PayloadReceivedEvent');
        await expect(tokenNativeDst.asterizmClReceive(currentChainIds[0], await tokenNativeSrc.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await ethers.provider.getBalance(user.address)).to.equal(startUserNativeBalance.add(valueWithDecimals.toString()).toString());
    });
    it("Should stake tokens and send coins, than stake coins and send tokens with native logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
        const value = 10;
        const valueWithDecimals = bigInt(value).multiply(pow.toString());
        const startUserNativeBalance = bigInt(await ethers.provider.getBalance(user.address));
        expect(await owner.sendTransaction({
            to: await tokenNativeDst.getAddress(),
            value: bigInt(100).multiply(pow.toString()).toString(),
        })).not.to.be.reverted;
        expect(await token1.approve(await tokenNativeSrc.getAddress(), valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenNativeSrc.crossChainTransfer(currentChainIds[1], owner.address, user.address, valueWithDecimals.toString()))
            .to.emit(tokenNativeSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await tokenNativeDst.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token1.balanceOf(await tokenNativeSrc.getAddress())).to.equal(valueWithDecimals.toString());
        let feeValue, packetValue;
        await expect(tokenNativeSrc.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(await tokenNativeSrc.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(await tokenNativeDst.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(tokenNativeDst, 'PayloadReceivedEvent');
        await expect(tokenNativeDst.asterizmClReceive(currentChainIds[0], await tokenNativeSrc.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await ethers.provider.getBalance(user.address)).to.equal(startUserNativeBalance.add(valueWithDecimals.toString()).toString());


        const startUserTokenBalance = bigInt(await token1.balanceOf(user.address));
        const startContractCoinBalance = bigInt(await ethers.provider.getBalance(await tokenNativeDst.getAddress()));
        const startContractTokenBalance = bigInt(await token1.balanceOf(await tokenNativeSrc.getAddress()));
        await expect(tokenNativeDst.crossChainTransfer(currentChainIds[0], user.address, user.address, valueWithDecimals.toString(), {value: valueWithDecimals.toString()}))
            .to.emit(tokenNativeDst, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[0]);
        expect(dstAddress).to.equal(await tokenNativeSrc.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await ethers.provider.getBalance(await tokenNativeDst.getAddress())).to.equal(startContractCoinBalance.add(valueWithDecimals.toString()).toString());
        await expect(tokenNativeDst.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator2, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[1]); // srcChainId
        expect(decodedValue[1]).to.equal(await tokenNativeDst.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[0]); // dstChainId
        expect(decodedValue[3]).to.equal(await tokenNativeSrc.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator1.transferMessage(300000, packetValue))
            .to.emit(tokenNativeSrc, 'PayloadReceivedEvent');
        await expect(tokenNativeSrc.asterizmClReceive(currentChainIds[1], await tokenNativeDst.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await token1.balanceOf(await tokenNativeSrc.getAddress())).to.equal(startContractTokenBalance.subtract(valueWithDecimals.toString()).toString());
        expect(await token1.balanceOf(user.address)).to.equal(startUserTokenBalance.add(valueWithDecimals.toString()).toString());
    });
    it("Should stake tokens and send coins, than stake coins and send tokens with native logic and fees", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
        const feeBase = 1000;
        const feeMul = 2;
        const value = 10;
        const valueWithDecimals = bigInt(value).multiply(pow.toString());
        const valueFee = valueWithDecimals.multiply(feeMul).divide(feeBase);
        const resultValueWithDecimals = valueWithDecimals.subtract(valueFee);
        const startUserNativeBalance = bigInt(await ethers.provider.getBalance(user.address));
        expect(await tokenNativeSrc.setFeeParams(feeBase, feeMul)).not.to.be.reverted;
        expect(await owner.sendTransaction({
            to: await tokenNativeDst.getAddress(),
            value: bigInt(100).multiply(pow.toString()).toString(),
        })).not.to.be.reverted;
        expect(await token1.approve(await tokenNativeSrc.getAddress(), valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenNativeSrc.crossChainTransfer(currentChainIds[1], owner.address, user.address, valueWithDecimals.toString()))
            .to.emit(tokenNativeSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await tokenNativeDst.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token1.balanceOf(await tokenNativeSrc.getAddress())).to.equal(resultValueWithDecimals.toString());
        expect(await token1.balanceOf(feeBaseUser.address)).to.equal(valueFee.toString());
        let feeValue, packetValue;
        await expect(tokenNativeSrc.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(await tokenNativeSrc.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(await tokenNativeDst.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(tokenNativeDst, 'PayloadReceivedEvent');
        await expect(tokenNativeDst.asterizmClReceive(currentChainIds[0], await tokenNativeSrc.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await ethers.provider.getBalance(user.address)).to.equal(startUserNativeBalance.add(resultValueWithDecimals.toString()).toString());

        expect(await tokenNativeDst.setFeeParams(feeBase, feeMul)).not.to.be.reverted;
        const startUserTokenBalance = bigInt(await token1.balanceOf(user.address));
        const startContractCoinBalance = bigInt(await ethers.provider.getBalance(await tokenNativeDst.getAddress()));
        const startFeeBaseUserCoinBalance = bigInt(await ethers.provider.getBalance(feeBaseUser.address));
        const startContractTokenBalance = bigInt(await token1.balanceOf(await tokenNativeSrc.getAddress()));
        await expect(tokenNativeDst.crossChainTransfer(currentChainIds[0], user.address, user.address, valueWithDecimals.toString(), {value: valueWithDecimals.toString()}))
            .to.emit(tokenNativeDst, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[0]);
        expect(dstAddress).to.equal(await tokenNativeSrc.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await ethers.provider.getBalance(await tokenNativeDst.getAddress())).to.equal(startContractCoinBalance.add(resultValueWithDecimals.toString()).toString());
        expect(await ethers.provider.getBalance(feeBaseUser.address)).to.equal(startFeeBaseUserCoinBalance.add(valueFee.toString()).toString());
        await expect(tokenNativeDst.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator2, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[1]); // srcChainId
        expect(decodedValue[1]).to.equal(await tokenNativeDst.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[0]); // dstChainId
        expect(decodedValue[3]).to.equal(await tokenNativeSrc.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator1.transferMessage(300000, packetValue))
            .to.emit(tokenNativeSrc, 'PayloadReceivedEvent');
        await expect(tokenNativeSrc.asterizmClReceive(currentChainIds[1], await tokenNativeDst.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await token1.balanceOf(await tokenNativeSrc.getAddress())).to.equal(startContractTokenBalance.subtract(resultValueWithDecimals.toString()).toString());
        expect(await token1.balanceOf(user.address)).to.equal(startUserTokenBalance.add(resultValueWithDecimals.toString()).toString());
    });

    it("Should stake tokens and then mint tokens with stable logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
        let value = 10;
        let valueWithDecimals = bigInt(value).multiply(pow.toString());
        let startOwnerTokenBalance = bigInt(await token2.balanceOf(owner.address));
        expect(await token2.approve(await tokenStableSrc.getAddress(), valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenStableSrc.crossChainTransfer(currentChainIds[1], owner.address, owner.address, valueWithDecimals.toString()))
            .to.emit(tokenStableSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await tokenStableDst.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token2.balanceOf(owner.address)).to.equal(startOwnerTokenBalance.subtract(valueWithDecimals.toString()).toString());
        expect(await token2.balanceOf(await tokenStableSrc.getAddress())).to.equal(valueWithDecimals.toString());
        let feeValue, packetValue;
        await expect(tokenStableSrc.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(await tokenStableSrc.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(await tokenStableDst.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(tokenStableDst, 'PayloadReceivedEvent');
        await expect(tokenStableDst.asterizmClReceive(currentChainIds[0], await tokenStableSrc.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await tokenStableDst.balanceOf(owner.address)).to.equal(valueWithDecimals.toString());
        expect(await tokenStableDst.totalSupply()).to.equal(valueWithDecimals.toString());
    });
    it("Should stake tokens and mint tokens, than burn tokens and send tokens with stable logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
        let value = 10;
        let valueWithDecimals = bigInt(value).multiply(pow.toString());
        let startOwnerTokenBalance = bigInt(await token2.balanceOf(owner.address));
        expect(await token2.approve(await tokenStableSrc.getAddress(), valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenStableSrc.crossChainTransfer(currentChainIds[1], owner.address, owner.address, valueWithDecimals.toString()))
            .to.emit(tokenStableSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await tokenStableDst.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token2.balanceOf(owner.address)).to.equal(startOwnerTokenBalance.subtract(valueWithDecimals.toString()).toString());
        expect(await token2.balanceOf(await tokenStableSrc.getAddress())).to.equal(valueWithDecimals.toString());
        let feeValue, packetValue;
        await expect(tokenStableSrc.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(await tokenStableSrc.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(await tokenStableDst.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(tokenStableDst, 'PayloadReceivedEvent');
        await expect(tokenStableDst.asterizmClReceive(currentChainIds[0], await tokenStableSrc.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await tokenStableDst.balanceOf(owner.address)).to.equal(valueWithDecimals.toString());
        expect(await tokenStableDst.totalSupply()).to.equal(valueWithDecimals.toString());


        const startOwnerStableTokenBalance = bigInt(await token2.balanceOf(owner.address));
        const startContractStableTokenBalance = bigInt(await token2.balanceOf(await tokenStableSrc.getAddress()));
        await expect(tokenStableDst.crossChainTransfer(currentChainIds[0], owner.address, owner.address, valueWithDecimals.toString(), {value: valueWithDecimals.toString()}))
            .to.emit(tokenStableDst, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[0]);
        expect(dstAddress).to.equal(await tokenStableSrc.getAddress());
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
        decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[1]); // srcChainId
        expect(decodedValue[1]).to.equal(await tokenStableDst.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[0]); // dstChainId
        expect(decodedValue[3]).to.equal(await tokenStableSrc.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator1.transferMessage(300000, packetValue))
            .to.emit(tokenStableSrc, 'PayloadReceivedEvent');
        await expect(tokenStableSrc.asterizmClReceive(currentChainIds[1], await tokenStableDst.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await token2.balanceOf(await tokenStableSrc.getAddress())).to.equal(startContractStableTokenBalance.subtract(valueWithDecimals.toString()).toString());
        expect(await token2.balanceOf(owner.address)).to.equal(startOwnerStableTokenBalance.add(valueWithDecimals.toString()).toString());
    });
    it("Should stake tokens and mint tokens, than burn tokens and send tokens with stable logic and fees", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
        const feeBase = 1000;
        const feeMul = 2;
        const value = 10;
        let valueWithDecimals = bigInt(value).multiply(pow.toString());
        let valueFee = valueWithDecimals.multiply(feeMul).divide(feeBase);
        let resultValueWithDecimals = valueWithDecimals.subtract(valueFee.toString());
        const startOwnerTokenBalance = bigInt(await token2.balanceOf(owner.address));
        expect(await tokenStableSrc.setFeeParams(feeBase, feeMul)).not.to.be.reverted;
        expect(await token2.approve(await tokenStableSrc.getAddress(), valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenStableSrc.crossChainTransfer(currentChainIds[1], owner.address, owner.address, valueWithDecimals.toString()))
            .to.emit(tokenStableSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await tokenStableDst.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token2.balanceOf(owner.address)).to.equal(startOwnerTokenBalance.subtract(valueWithDecimals.toString()).toString());
        expect(await token2.balanceOf(await tokenStableSrc.getAddress())).to.equal(resultValueWithDecimals.toString());
        expect(await token2.balanceOf(feeBaseUser.address)).to.equal(valueFee.toString());
        let feeValue, packetValue;
        await expect(tokenStableSrc.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(await tokenStableSrc.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(await tokenStableDst.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(tokenStableDst, 'PayloadReceivedEvent');
        await expect(tokenStableDst.asterizmClReceive(currentChainIds[0], await tokenStableSrc.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await tokenStableDst.balanceOf(owner.address)).to.equal(resultValueWithDecimals.toString());
        expect(await tokenStableDst.totalSupply()).to.equal(resultValueWithDecimals.toString());

        valueWithDecimals = bigInt(await tokenStableDst.balanceOf(owner.address));
        valueFee = valueWithDecimals.multiply(feeMul).divide(feeBase);
        resultValueWithDecimals = valueWithDecimals.subtract(valueFee.toString());
        expect(await tokenStableDst.setFeeParams(feeBase, feeMul)).not.to.be.reverted;
        const startOwnerStableTokenBalance = bigInt(await token2.balanceOf(owner.address));
        const startContractStableTokenBalance = bigInt(await token2.balanceOf(await tokenStableSrc.getAddress()));
        await expect(tokenStableDst.crossChainTransfer(currentChainIds[0], owner.address, owner.address, valueWithDecimals.toString(), {value: valueWithDecimals.toString()}))
            .to.emit(tokenStableDst, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[0]);
        expect(dstAddress).to.equal(await tokenStableSrc.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await tokenStableDst.balanceOf(owner.address)).to.equal(0);
        expect(await tokenStableDst.totalSupply()).to.equal(0);
        expect(await tokenStableDst.balanceOf(feeBaseUser.address)).to.equal(0);
        await expect(tokenStableDst.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator2, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[1]); // srcChainId
        expect(decodedValue[1]).to.equal(await tokenStableDst.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[0]); // dstChainId
        expect(decodedValue[3]).to.equal(await tokenStableSrc.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        await expect(translator1.transferMessage(300000, packetValue))
            .to.emit(tokenStableSrc, 'PayloadReceivedEvent');
        await expect(tokenStableSrc.asterizmClReceive(currentChainIds[1], await tokenStableDst.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await token2.balanceOf(await tokenStableSrc.getAddress())).to.equal(startContractStableTokenBalance.subtract(resultValueWithDecimals.toString()).toString());
        expect(await token2.balanceOf(owner.address)).to.equal(startOwnerStableTokenBalance.add(resultValueWithDecimals.toString()).toString());
    });
    it("Should not withdrawal tokens with native logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
        let value = 10;
        let valueWithDecimals = bigInt(value).multiply(pow.toString());
        expect(await token1.approve(await tokenNativeSrc.getAddress(), valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenNativeSrc.crossChainTransfer(currentChainIds[1], owner.address, user.address, valueWithDecimals.toString()))
            .to.emit(tokenNativeSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await tokenNativeDst.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token1.balanceOf(await tokenNativeSrc.getAddress())).to.equal(valueWithDecimals.toString());
        await expect(tokenNativeSrc.withdrawTokens(await token1.getAddress(), owner.address, valueWithDecimals.toString()))
            .to.be.revertedWithCustomError(tokenNativeSrc, 'CustomErrorWithdraw')
            .withArgs(6002);
    });
    it("Should not withdrawal tokens with stable logic", async function () {
        let dstChainId, dstAddress, txId, transferHash, payload;
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Token, token1, token2, TokenNativeSrc, TokenNativeDst, TokenStableSrc, TokenStableDst, tokenNativeSrc, tokenNativeDst, tokenStableSrc, tokenStableDst, owner, user, feeBaseUser, feeProviderUser, currentChainIds } = await loadFixture(deployContractsFixture);
        let value = 10;
        let valueWithDecimals = bigInt(value).multiply(pow.toString());
        expect(await token2.approve(await tokenStableSrc.getAddress(), valueWithDecimals.toString())).not.to.be.reverted;
        await expect(tokenStableSrc.crossChainTransfer(currentChainIds[1], owner.address, user.address, valueWithDecimals.toString()))
            .to.emit(tokenStableSrc, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await tokenStableDst.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token2.balanceOf(await tokenStableSrc.getAddress())).to.equal(valueWithDecimals.toString());
        await expect(tokenStableSrc.withdrawTokens(await token2.getAddress(), owner.address, valueWithDecimals.toString()))
            .to.be.revertedWithCustomError(tokenNativeSrc, 'CustomErrorWithdraw')
            .withArgs(6002);
    });
});
