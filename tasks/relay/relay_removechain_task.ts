import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import { Chains } from "../base/base_chains";

async function deployBase(hre, isTestnet) {
    const TranslatorContract = await ethers.getContractFactory("AsterizmTranslatorV1");
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

    let gasLimit = bigInt(0);
    const translatorContract = await TranslatorContract.attach(currentChain?.contractAddresses.translator.address);

    return {translatorContract, gasLimit};
}

task("relay:removeChain", "Remove chain from relay (translator) contract by ID")
    .addPositionalParam("chainId", "Chain ID")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {translatorContract, gasLimit} = await deployBase(hre, taskArgs.isTestnet);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Removing contract trusted address...");
        let tx = await translatorContract.removeChainById(taskArgs.chainId, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("\nChain removed successfully\n");

        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Transaction hash: %s\n", tx.hash);
    });
