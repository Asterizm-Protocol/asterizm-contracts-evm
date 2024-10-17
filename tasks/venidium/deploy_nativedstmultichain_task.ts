import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(hre, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Token = await ethers.getContractFactory("NativeDstMultichainUpgradeableV1");

    let gasLimit = BigNumber.from(0);
    const initializer = await Initializer.attach(initializerAddress);

    return {initializer, Token, owner, gasLimit};
}

task("venidium:deployNativeDst", "Deploy venidium native dst contract")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("initSupply", "Initial token supply", '0')
    .addPositionalParam("decimals", "Token decimals", '18')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, Token, owner, gasLimit} = await deployBase(hre, taskArgs.initializerAddress);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Deploying venidium native dst contract...");
        // const token = await Token.deploy(initializer.address, BigNumber.from(taskArgs.initSupply), taskArgs.decimals, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        const token = await upgrades.deployProxy(Token, [initializer.address, BigNumber.from(taskArgs.initSupply), taskArgs.decimals], {
            initialize: 'initialize',
            kind: 'uups',
        });
        tx = await token.deployed();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", initializer.address);
        console.log("Venidium native dst token address: %s\n", token.address);
    })
