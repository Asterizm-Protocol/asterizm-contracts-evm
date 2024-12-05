import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import { Chains } from "../base/base_chains";

async function deployBase(hre, isTestnet) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");

    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let chainIds = [];
    let chainTypes = [];
    let currentChain = null;
    for (let i = 0; i < chains.length; i++) {
        chainIds.push(chains[i].id);
        chainTypes.push(chains[i].chainType);
        if (chains[i].networkName == hre.network.name) {
            currentChain = chains[i];
        }
    }
    if (!currentChain) {
        throw new Error('Chain not supported!');
    }

    let gasLimit = bigInt(0);
    const initializer = await Initializer.attach(currentChain?.contractAddresses.initializer.address);

    return {initializer, owner, gasLimit};
}

task("deploy:checker", "Deploy Asterizm checker contract")
    .addPositionalParam("relayAddress", "Config contract address", '0')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, owner, gasLimit} = await deployBase(hre, taskArgs.isTestnet);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Deploying checker contract...");
        const Checker = await ethers.getContractFactory("Checker");
        // const checker = await Checker.attach('0x...');
        const checker = await Checker.deploy(await initializer.getAddress(), gasPrice > 0 ? {gasPrice: gasPrice} : {});
        tx = await checker.waitForDeployment();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);
        if (taskArgs.relayAddress != '0') {
            tx = await checker.setExternalRelay(taskArgs.relayAddress, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
            console.log("Set external relay successfully. Address: %s", taskArgs.relayAddress);
        }

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", await initializer.getAddress());
        if (taskArgs.relayAddress != '0') {
            console.log("External relay address: %s", taskArgs.relayAddress);
            console.log("Checker address: %s\n", await checker.getAddress());
        } else {
            console.log("Checker address: %s\n", await checker.getAddress());
        }
    })
