import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";
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

    let gasLimit = BigNumber.from(0);
    const translatorContract = await TranslatorContract.attach(currentChain?.contractAddresses.translator.address);

    return {translatorContract, gasLimit};
}

task("relay:addChain", "Add chain to relay (translator) contract")
    .addPositionalParam("chainId", "Chain ID")
    .addPositionalParam("chainType", "Chain type (see ChainTypes)")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {translatorContract, gasLimit} = await deployBase(hre, taskArgs.isTestnet);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Adding contract trusted address...");
        let tx = await translatorContract.addChain(taskArgs.chainId, taskArgs.chainType, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("\nChain added successfully\n");

        console.log("Total gas limit: %s", gasLimit);
        console.log("Transaction hash: %s\n", tx.hash);
    });
