import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { Chains } from '../base/base_chains';
const bigInt = require("big-integer");

async function deployBase(hre, isTestnet, gasPrice) {
    const [owner] = await ethers.getSigners();
    const TranslatorChainlink = await ethers.getContractFactory("AsterizmTranslatorChainlink");

    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let chainIds = [];
    let chainRelays = [];
    let currentChain = null;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].chainlink.chainSelector == '0') {
            continue;
        }

        chainIds.push(chains[i].id);
        chainRelays.push(chains[i].chainlink.asterizmRouter);
        if (chains[i].networkName == hre.network.name) {
            currentChain = chains[i];
        }
    }
    if (!currentChain) {
        throw new Error('Chain not supported!');
    }
    if (currentChain.chainlink.asterizmRouter == '0x0000000000000000000000000000000000000000') {
        throw new Error('Chain has not Asterizm router!');
    }

    const translatorChainlink = await TranslatorChainlink.attach(currentChain?.chainlink.asterizmRouter);

    return {translatorChainlink, owner, currentChain, chainIds, chainRelays};
}

task("chainlink:fillChainRelays", "Fill Cainlink cain relays")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {translatorChainlink, owner, currentChain, chainIds, chainRelays} = await deployBase(hre, taskArgs.isTestnet, parseInt(taskArgs.gasPrice));

        let gasLimit = bigInt(0);
        let tx;

        tx = await translatorChainlink.addChainRelays(chainIds, chainRelays);
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Chain relays set successfully\n");

        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Chainlink translator address: %s", await translatorChainlink.getAddress());
        console.log("Transaction hash: %s\n", tx.hash);
    });
