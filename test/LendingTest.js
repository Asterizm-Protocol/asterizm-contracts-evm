const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const bigInt = require("big-integer");

const DECIMALS = bigInt(18);
const POW = bigInt(10).pow(DECIMALS.toString());
// const TOKEN_AMOUNT = bigInt('1000000').multiply(POW.toString());
const TOKEN_AMOUNT = bigInt('1000000');
const TOKEN_AMOUNT_WITH_DECIMALS = bigInt('1000000').multiply(POW.toString());
const RATE_DIV = bigInt('10000000000');
const INTEREST_FOR_BLOCK = bigInt('385802469130');

describe("Lending test", function () {
    async function deployContractsFixture() {
        const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
        const Translator = await ethers.getContractFactory("AsterizmTranslatorV1");
        const Token = await ethers.getContractFactory("AsterizmTestToken");
        const LendingInitializer = await ethers.getContractFactory("LendingInitializerTest");
        const Lending = await ethers.getContractFactory("LendingBase");
        const LendingUpgrade = await ethers.getContractFactory("LendingBaseUpgradeableV1");
        const Pool = await ethers.getContractFactory("LendingPool");
        const PoolUpgrade = await ethers.getContractFactory("LendingPoolUpgradeableV1");
        const [owner, feeCollector, user] = await ethers.getSigners();
        const currentChainIds = [1, 2];
        const chainTypes = {EVM: 1, TVM: 2};

        const translator1 = await upgrades.deployProxy(Translator, [currentChainIds[0], chainTypes.EVM], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await translator1.waitForDeployment();
        await translator1.addChains(currentChainIds, [chainTypes.EVM, chainTypes.EVM]);
        await translator1.addRelayer(owner.address);

        const translator2 = await upgrades.deployProxy(Translator, [currentChainIds[1], chainTypes.EVM], {
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

        const token = await Token.deploy(TOKEN_AMOUNT.multiply('2').toString(), DECIMALS.toString());
        await token.waitForDeployment();

        const lendingInitializer = await LendingInitializer.deploy(await initializer1.getAddress());
        await lendingInitializer.waitForDeployment();

        const lending = await Lending.deploy(await initializer2.getAddress(), feeCollector.address);
        await lending.waitForDeployment();
        await lendingInitializer.addTrustedAddresses(currentChainIds, [await lendingInitializer.getAddress(), await lending.getAddress()]);
        await lending.addTrustedAddresses(currentChainIds, [await lendingInitializer.getAddress(), await lending.getAddress()]);

        const pool = await Pool.deploy(await lending.getAddress(), await token.getAddress());
        await pool.waitForDeployment();

        await lending.setBasePool(await pool.getAddress());
        await token.transfer(await pool.getAddress(), TOKEN_AMOUNT_WITH_DECIMALS.toString());

        return {
            Initializer, initializer1, initializer2, Translator, translator1, translator2, Token, token, LendingInitializer,
            lendingInitializer, Lending, lending, Pool, pool, owner, feeCollector, user, currentChainIds
        };
    }

    it("Should deploying contracts successfully", async function () {
        const {
            Initializer, initializer1, initializer2, Translator, translator1, translator2, Token, token, LendingInitializer,
            lendingInitializer, Lending, lending, Pool, pool, owner, feeCollector, user, currentChainIds
        } = await loadFixture(deployContractsFixture);
    });
    it("Should check token balances", async function () {
        const {
            Initializer, initializer1, initializer2, Translator, translator1, translator2, Token, token, LendingInitializer,
            lendingInitializer, Lending, lending, Pool, pool, owner, feeCollector, user, currentChainIds
        } = await loadFixture(deployContractsFixture);

        expect(await token.balanceOf(owner.address)).to.equal(TOKEN_AMOUNT_WITH_DECIMALS.toString());
        expect(await token.balanceOf(await pool.getAddress())).to.equal(
            TOKEN_AMOUNT_WITH_DECIMALS.toString()
        );
    });

    it("Should initiate transfer successfully", async function () {
        const {
            Initializer, initializer1, initializer2, Translator, translator1, translator2, Token, token, LendingInitializer,
            lendingInitializer, Lending, lending, Pool, pool, owner, feeCollector, user, currentChainIds
        } = await loadFixture(deployContractsFixture);

        const rate = bigInt('1').multiply(RATE_DIV.toString());
        const amount = bigInt('1000').multiply(POW.toString());
        let dstChainId, dstAddress, txId, transferHash, payload;
        await expect(lendingInitializer.connect(user).initPosition(currentChainIds[1], amount.toString(), rate.toString(), user.address))
            .to.emit(lendingInitializer, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await lending.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        await expect(lendingInitializer.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent');
    });

    it("Should opening position successfully", async function () {
        const {
            Initializer, initializer1, initializer2, Translator, translator1, translator2, Token, token, LendingInitializer,
            lendingInitializer, Lending, lending, Pool, pool, owner, feeCollector, user, currentChainIds
        } = await loadFixture(deployContractsFixture);

        let provider = ethers.provider;

        const rate = bigInt('1').multiply(RATE_DIV.toString());
        const amount = bigInt('10').multiply(POW.toString());

        expect(await provider.getBalance(await lendingInitializer.getAddress())).to.equal('0');
        expect(await token.balanceOf(user.address)).to.equal('0');
        expect(await token.balanceOf(await pool.getAddress())).to.equal(TOKEN_AMOUNT_WITH_DECIMALS.toString());

        let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload;
        await expect(lendingInitializer.connect(user).initPosition(currentChainIds[1], amount.toString(), rate.toString(), user.address, {value: amount.toString()}))
            .to.emit(lendingInitializer, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await lending.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;

        await expect(lendingInitializer.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(await lendingInitializer.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(await lending.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        expect(await provider.getBalance(await lendingInitializer.getAddress())).to.equal(amount.toString());

        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(lending, 'PayloadReceivedEvent');
        await expect(lending.asterizmClReceive(currentChainIds[0], await lendingInitializer.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await token.balanceOf(user.address)).to.equal(amount.toString());
        expect(await token.balanceOf(await pool.getAddress())).to.equal(TOKEN_AMOUNT_WITH_DECIMALS.subtract(amount).toString());
    });

    it("Should closing position successfully", async function () {
        const {
            Initializer, initializer1, initializer2, Translator, translator1, translator2, Token, token, LendingInitializer,
            lendingInitializer, Lending, lending, Pool, pool, owner, feeCollector, user, currentChainIds
        } = await loadFixture(deployContractsFixture);

        let provider = ethers.provider;

        const rate = bigInt('1').multiply(RATE_DIV.toString());
        const amount = bigInt('10').multiply(POW.toString());

        expect(await provider.getBalance(await lendingInitializer.getAddress())).to.equal('0');
        expect(await token.balanceOf(user.address)).to.equal('0');
        expect(await token.balanceOf(await pool.getAddress())).to.equal(TOKEN_AMOUNT_WITH_DECIMALS.toString());

        let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload, stakeId;
        await expect(lendingInitializer.connect(user).initPosition(currentChainIds[1], amount.toString(), rate.toString(), user.address, {value: amount.toString()}))
            .to.emit(lendingInitializer, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        stakeId = txId;
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await lending.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;

        await expect(lendingInitializer.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(await lendingInitializer.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(await lending.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        expect(await provider.getBalance(await lendingInitializer.getAddress())).to.equal(amount.toString());

        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(lending, 'PayloadReceivedEvent');
        await expect(lending.asterizmClReceive(currentChainIds[0], await lendingInitializer.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await token.balanceOf(user.address)).to.equal(amount.toString());
        expect(await token.balanceOf(await pool.getAddress())).to.equal(TOKEN_AMOUNT_WITH_DECIMALS.subtract(amount).toString());

        await token.transfer(user.address, bigInt('100').multiply(POW.toString()).toString());

        await expect(lending.crossChainUnstake(stakeId, currentChainIds[0], user.address))
            .to.be.revertedWithCustomError(lending, 'CustomError')
            .withArgs(10010); // LENDING__WRONG_CLIENT_ADDRESS__ERROR

        await expect(lending.connect(user).crossChainUnstake(stakeId, currentChainIds[0], user.address))
            .to.be.revertedWithCustomError(lending, 'CustomError')
            .withArgs(10009); // LENDING__CLIENT_ALLOWANCE_IS_NOT_ENOUGH__ERROR

        const userTokenBalanceBefore = bigInt(await token.balanceOf(user.address));
        const poolTokenBalanceBefore = bigInt(await token.balanceOf(await pool.getAddress()));
        const feeCollectorTokenBalanceBefore = bigInt(await token.balanceOf(feeCollector.address));

        await expect(token.connect(user).approve(await lending.getAddress(), userTokenBalanceBefore.toString())).to.not.reverted;

        const userTokenFee = INTEREST_FOR_BLOCK.multiply(5);
        const userTokenAmount = amount.add(userTokenFee.toString());

        await expect(lending.connect(user).crossChainUnstake(stakeId, currentChainIds[0], user.address))
            .to.emit(lending, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        expect(dstChainId).to.equal(currentChainIds[0]);
        expect(dstAddress).to.equal(await lendingInitializer.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;
        expect(await token.balanceOf(user.address)).to.equal(userTokenBalanceBefore.subtract(userTokenAmount.toString()).toString());
        expect(await token.balanceOf(await pool.getAddress())).to.equal(poolTokenBalanceBefore.add(amount.toString()).toString());
        expect(await token.balanceOf(feeCollector.address)).to.equal(feeCollectorTokenBalanceBefore.add(userTokenFee.toString()).toString());

        await expect(lending.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator2, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[1]); // srcChainId
        expect(decodedValue[1]).to.equal(await lending.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[0]); // dstChainId
        expect(decodedValue[3]).to.equal(await lendingInitializer.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash

        const userCoinBalanceBefore = bigInt(await provider.getBalance(user.address));
        const lendingCoinBalanceBefore = bigInt(await provider.getBalance(await lendingInitializer.getAddress()));
        await expect(translator1.transferMessage(300000, packetValue))
            .to.emit(lendingInitializer, 'PayloadReceivedEvent');
        await expect(lendingInitializer.asterizmClReceive(currentChainIds[1], await lending.getAddress(), decodedValue[4], decodedValue[6], payload))
            .to.emit(lendingInitializer, 'InAsterizmTransferEvent');
        expect(await provider.getBalance(user.address)).to.equal(userCoinBalanceBefore.add(amount.toString()).toString());
        expect(await provider.getBalance(await lendingInitializer.getAddress())).to.equal(lendingCoinBalanceBefore.subtract(amount.toString()).toString());
    });

    it("Should liquidate position successfully", async function () {
        const {
            Initializer, initializer1, initializer2, Translator, translator1, translator2, Token, token, LendingInitializer,
            lendingInitializer, Lending, lending, Pool, pool, owner, feeCollector, user, currentChainIds
        } = await loadFixture(deployContractsFixture);

        let provider = ethers.provider;

        const rate = bigInt('1').multiply(RATE_DIV.toString());
        const amount = bigInt('10').multiply(POW.toString());

        expect(await provider.getBalance(await lendingInitializer.getAddress())).to.equal('0');
        expect(await token.balanceOf(user.address)).to.equal('0');
        expect(await token.balanceOf(await pool.getAddress())).to.equal(TOKEN_AMOUNT_WITH_DECIMALS.toString());

        let feeValue, packetValue, dstChainId, dstAddress, txId, transferHash, payload, stakeId;
        await expect(lendingInitializer.connect(user).initPosition(currentChainIds[1], amount.toString(), rate.toString(), user.address, {value: amount.toString()}))
            .to.emit(lendingInitializer, 'InitiateTransferEvent')
            .withArgs(
                (value) => {dstChainId = value; return true;},
                (value) => {dstAddress = value; return true;},
                (value) => {txId = value; return true;},
                (value) => {transferHash = value; return true;},
                (value) => {payload = value; return true;},
            );
        stakeId = txId;
        expect(dstChainId).to.equal(currentChainIds[1]);
        expect(dstAddress).to.equal(await lending.getAddress());
        expect(txId).to.equal(0);
        expect(transferHash).to.not.null;
        expect(payload).to.not.null;

        await expect(lendingInitializer.initAsterizmTransfer(dstChainId, txId, transferHash))
            .to.emit(translator1, 'SendMessageEvent')
            .withArgs(
                (value) => {feeValue = value; return true;},
                (value) => {packetValue = value; return true;},
            );
        let decodedValue = ethers.AbiCoder.defaultAbiCoder().decode(['uint64', 'uint', 'uint64', 'uint', 'uint', 'bool', 'bytes32'], packetValue);
        expect(decodedValue[0]).to.equal(currentChainIds[0]); // srcChainId
        expect(decodedValue[1]).to.equal(await lendingInitializer.getAddress()); // srcAddress
        expect(decodedValue[2]).to.equal(currentChainIds[1]); // dstChainId
        expect(decodedValue[3]).to.equal(await lending.getAddress()); // dstAddress
        expect(feeValue).to.equal(0); // feeValue
        expect(decodedValue[4]).to.equal(0); // txId
        expect(decodedValue[5]).to.equal(true); // transferResultNotifyFlag
        expect(decodedValue[6]).to.equal(transferHash); // transferHash
        expect(await provider.getBalance(await lendingInitializer.getAddress())).to.equal(amount.toString());

        await expect(translator2.transferMessage(300000, packetValue))
            .to.emit(lending, 'PayloadReceivedEvent');
        await expect(lending.asterizmClReceive(currentChainIds[0], await lendingInitializer.getAddress(), decodedValue[4], decodedValue[6], payload)).to.not.reverted;
        expect(await token.balanceOf(user.address)).to.equal(amount.toString());
        expect(await token.balanceOf(await pool.getAddress())).to.equal(TOKEN_AMOUNT_WITH_DECIMALS.subtract(amount).toString());

        await token.transfer(user.address, bigInt('100').multiply(POW.toString()).toString());

        await expect(lending.crossChainUnstake(stakeId, currentChainIds[0], user.address))
            .to.be.revertedWithCustomError(lending, 'CustomError')
            .withArgs(10010); // LENDING__WRONG_CLIENT_ADDRESS__ERROR

        await expect(lending.connect(user).crossChainUnstake(stakeId, currentChainIds[0], user.address))
            .to.be.revertedWithCustomError(lending, 'CustomError')
            .withArgs(10009); // LENDING__CLIENT_ALLOWANCE_IS_NOT_ENOUGH__ERROR

        const userTokenBalanceBefore = bigInt(await token.balanceOf(user.address));

        await expect(token.connect(user).approve(await lending.getAddress(), userTokenBalanceBefore.toString())).to.not.reverted;

        await expect(lending.liquidatePosition(stakeId))
            .to.emit(lending, 'LiquidatePositionEvent');

        await expect(lending.connect(user).crossChainUnstake(stakeId, currentChainIds[0], user.address))
            .to.be.revertedWithCustomError(lending, 'CustomError')
            .withArgs(10007); // LENDING__POSITION_IS_CLOSED_ALREADY__ERROR
    });
});
