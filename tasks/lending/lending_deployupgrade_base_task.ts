import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");

async function deployBase(hre, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");

    let gasLimit = bigInt(0);
    const initializer = await Initializer.attach(initializerAddress);

    return {initializer, owner, gasLimit};
}

task("lending:deploy-upgrade-base", "Deploy base Lending contracts (upgradeable)")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("poolTokenAddress", "Pool token address")
    .addPositionalParam("feeCollectorAddress", "Fee collector address")
    .setAction(async (taskArgs, hre) => {
        let {initializer, owner, gasLimit} = await deployBase(hre, taskArgs.initializerAddress);

        let tx;
        const Lend = await ethers.getContractFactory("LendingBaseUpgradeableV1");
        const Pool = await ethers.getContractFactory("LendingPoolUpgradeableV1");
        console.log("Deploying base lending contract...");
        const lend = await upgrades.deployProxy(Lend, [await initializer.getAddress(), taskArgs.feeCollectorAddress], {
            initialize: 'initialize',
            kind: 'uups',
        });
        tx = await lend.waitForDeployment();
        gasLimit = gasLimit.add((await tx.deploymentTransaction()).gasLimit);
        console.log("Base lending contract deployed successfully. Address: %s", await lend.getAddress());

        console.log("Deploying lending pool contract...");
        const pool = await upgrades.deployProxy(Pool, [await lend.getAddress(), taskArgs.poolTokenAddress], {
            initialize: 'initialize',
            kind: 'uups',
        });
        tx = await pool.waitForDeployment();
        gasLimit = gasLimit.add((await tx.deploymentTransaction()).gasLimit);
        console.log("Lending pool contract deployed successfully. Address: %s", await pool.getAddress());

        await lend.setBasePool(await pool.getAddress());

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", await initializer.getAddress());
        console.log("Base lending address: %s", await lend.getAddress());
        console.log("Pool lending address: %s\n", await pool.getAddress());
    })
