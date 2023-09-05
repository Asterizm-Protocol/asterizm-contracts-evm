import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(hre, isTestnet, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");

    let gasLimit = BigNumber.from(0);
    const initializer = await Initializer.attach(initializerAddress);

    return {initializer, owner, gasLimit};
}

task("deploy:checker", "Deploy Asterizm checker contract")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, owner, gasLimit} = await deployBase(hre, taskArgs.isTestnet, taskArgs.initializerAddress);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Deploying checker contract...");
        const Checker = await ethers.getContractFactory("Checker");
        // const checker = await Checker.attach('0x...');
        const checker = await Checker.deploy(initializer.address, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        tx = await checker.deployed();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", initializer.address);
        console.log("Checker address: %s\n", checker.address);
    })
