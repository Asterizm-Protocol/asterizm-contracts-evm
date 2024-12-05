import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import {Chains} from "../base/base_chains";

async function deployBase(hre, implementationVersion, isTestnet) {
    const [owner] = await ethers.getSigners();
    const GasStation = await ethers.getContractFactory("GasStationUpgradeableV" + implementationVersion);
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

    return {owner, GasStation, gasLimit, currentChain};
}

task("upgrade:gas", "Update Asterizm GasSender contracts")
    .addPositionalParam("implementationVersion", "Implementation version", '1')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {owner, GasStation, gasLimit, currentChain} = await deployBase(hre, taskArgs.implementationVersion, taskArgs.isTestnet);

        console.log("Upgrading gas station implementation...");

        const gasStation = await upgrades.upgradeProxy(currentChain.trustAddresses.gas.address, GasStation);
        gasLimit = gasLimit.add(gasStation.deployTransaction.gasLimit);
        console.log("GasStation implementation upgrade successfully");

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Gas station address: %s", await gasStation.getAddress());
        console.log("Transaction hash: %s\n", gasStation.deployTransaction.hash);
    });
