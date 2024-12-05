import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import { Chains } from '../base/base_chains';

async function deployBase(hre, implementationVersion, isTestnet) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV" + implementationVersion);
    let gasLimit = bigInt(0);

    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let currentChain = null;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].networkName == hre.network.name) {
            currentChain = chains[i];
            break;
        }
    }
    if (!currentChain) {
        throw new Error('Chain not supported!');
    }

    return {owner, Initializer, gasLimit, currentChain};
}

task("upgrade:initializer", "Update Asterizm Initialozer contracts")
    .addPositionalParam("implementationVersion", "Implementation version", '1')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {owner, Initializer, gasLimit, currentChain} = await deployBase(hre, taskArgs.implementationVersion, taskArgs.isTestnet);

        console.log("Upgrading initializer implementation...");

        const initializer = await upgrades.upgradeProxy(currentChain.contractAddresses.initializer.address, Initializer);
        gasLimit = gasLimit.add(initializer.deployTransaction.gasLimit);
        console.log("Initializer implementation upgrade successfully");

        console.log("Updating was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", await initializer.getAddress());
        console.log("Transaction hash: %s\n", initializer.deployTransaction.hash);
    });
