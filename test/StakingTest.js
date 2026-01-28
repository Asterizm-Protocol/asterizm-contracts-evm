const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const bigInt = require("big-integer");

const pow = bigInt(10).pow(18);
const TOKEN_AMOUNT = bigInt('1000000').multiply(pow.toString());

describe("Staking token test", function () {
    async function deployContractsFixture() {
        const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
        const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
        const Stake = await ethers.getContractFactory("StakingToken");
        const StakeUpgrade = await ethers.getContractFactory("StakingTokenUpgradeableV1");
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

        const stake1 = await Stake.deploy(await initializer1.getAddress(), TOKEN_AMOUNT.toString());
        await stake1.waitForDeployment();
        const stake2 = await Stake.deploy(await initializer2.getAddress(), TOKEN_AMOUNT.toString());
        await stake2.waitForDeployment();
        await stake1.addTrustedAddresses(currentChainIds, [await stake1.getAddress(), await stake2.getAddress()]);
        await stake2.addTrustedAddresses(currentChainIds, [await stake1.getAddress(), await stake2.getAddress()]);

        const stakeUpgrade1 = await upgrades.deployProxy(StakeUpgrade, [await initializer1.getAddress(), TOKEN_AMOUNT.toString()], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await stakeUpgrade1.waitForDeployment();
        const stakeUpgrade2 = await upgrades.deployProxy(StakeUpgrade, [await initializer2.getAddress(), TOKEN_AMOUNT.toString()], {
            initialize: 'initialize',
            kind: 'uups',
        });
        await stakeUpgrade2.waitForDeployment();
        await stakeUpgrade1.addTrustedAddresses(currentChainIds, [await stakeUpgrade1.getAddress(), await stakeUpgrade2.getAddress()]);
        await stakeUpgrade2.addTrustedAddresses(currentChainIds, [await stakeUpgrade1.getAddress(), await stakeUpgrade2.getAddress()]);

        // Fixtures can return anything you consider useful for your tests
        return { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Stake, stake1, stake2, StakeUpgrade, stakeUpgrade1, stakeUpgrade2, owner, user, currentChainIds};
    }

    it("Should successfuly deploy contracts", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Stake, stake1, stake2, StakeUpgrade, stakeUpgrade1, stakeUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
    });
    it("Check address balances", async function () {
        const { Initializer, initializer1, initializer2, Transalor, translator1, translator2, Stake, stake1, stake2, StakeUpgrade, stakeUpgrade1, stakeUpgrade2, owner, user, currentChainIds } = await loadFixture(deployContractsFixture);
        let balance = await(stake1.balanceOf(owner.address));
        expect(await stake1.balanceOf(owner.address)).to.equal(
            TOKEN_AMOUNT.toString()
        );
    });
});
