import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");

async function deployBase(hre, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Token = await ethers.getContractFactory("NativeSrcMultichainUpgradeableV1");

    let gasLimit = bigInt(0);
    const initializer = await Initializer.attach(initializerAddress);

    return {initializer, Token, owner, gasLimit};
}

task("venidium:deployNativeSrc", "Deploy venidium native src contract")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("externalTokenAddress", "External token address")
    .addPositionalParam("feeBaseAddress", "Base fee address")
    .addPositionalParam("feeBase", "Fee base param", '1000')
    .addPositionalParam("feeMul", "Fee multiplier param", '2')
    .addPositionalParam("initSupply", "Initial token supply", '0')
    .addPositionalParam("decimals", "Token decimals", '18')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, Token, owner, gasLimit} = await deployBase(hre, taskArgs.initializerAddress);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Deploying venidium native src contract...");
        const token = await upgrades.deployProxy(Token, [await initializer.getAddress(), bigInt(taskArgs.initSupply).toString(), taskArgs.decimals, taskArgs.externalTokenAddress, taskArgs.feeBaseAddress], {
            initialize: 'initialize',
            kind: 'uups',
        });
        tx = await token.waitForDeployment();
        gasLimit = gasLimit.add((await tx.deploymentTransaction()).gasLimit);

        tx = await token.setFeeParams(taskArgs.feeBase, taskArgs.feeMul);
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", await initializer.getAddress());
        console.log("Venidium native src token address: %s\n", await token.getAddress());
    })
