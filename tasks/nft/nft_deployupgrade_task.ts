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

task("nft:deploy-upgrade", "Deploy Canton NFT token contract (upgradeable)")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("title", "NFT title")
    .addPositionalParam("symbol", "NFT ticker")
    .addPositionalParam("url", "NFT URL")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, owner, gasLimit} = await deployBase(hre, taskArgs.initializerAddress);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Deploying staking token contract...");
        const NFT = await ethers.getContractFactory("CantonNftUpgradeableV1");
        const stake = await upgrades.deployProxy(NFT, [await initializer.getAddress(), taskArgs.title, taskArgs.symbol, taskArgs.url], {
            initialize: 'initialize',
            kind: 'uups',
        });
        tx = await stake.waitForDeployment();
        gasLimit = gasLimit.add((await tx.deploymentTransaction()).gasLimit);

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", await initializer.getAddress());
        console.log("Canton NFT address: %s\n", await stake.getAddress());
    })
