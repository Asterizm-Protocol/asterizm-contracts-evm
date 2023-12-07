import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";
import {Chains} from "../base/base_chains";

async function deployBase(hre, implementationVersion, isTestnet) {
    const [owner] = await ethers.getSigners();
    const Translator = await ethers.getContractFactory("AsterizmTranslatorV" + implementationVersion);
    let gasLimit = BigNumber.from(0);

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

    return {owner, Translator, gasLimit, currentChain};
}

task("upgrade:translator", "Update Asterizm Translator contracts")
    .addPositionalParam("implementationVersion", "Implementation version", '1')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {owner, Translator, gasLimit, currentChain} = await deployBase(hre, taskArgs.implementationVersion, taskArgs.isTestnet);

        console.log("Upgrading translator implementation...");

        const translator = await upgrades.upgradeProxy(currentChain.contractAddresses.translator.address, Translator);
        gasLimit = gasLimit.add(translator.deployTransaction.gasLimit);
        console.log("Translator implementation upgrade successfully");

        console.log("Updating was done\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Translator address: %s", translator.address);
        console.log("Transaction hash: %s\n", translator.deployTransaction.hash);
    });
