import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { Chains } from '../base/base_chains';
const bigInt = require("big-integer");

async function deployBase(hre, isTestnet, gasPrice) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const TranslatorChainlink = await ethers.getContractFactory("AsterizmTranslatorChainlink");

    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let chainIds = [];
    let chainTypes = [];
    let chainSelectors = [];
    let currentChain = null;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].chainlink.chainSelector == '0') {
            continue;
        }

        chainIds.push(chains[i].id);
        chainTypes.push(chains[i].chainType);
        chainSelectors.push(chains[i].chainlink.chainSelector);
        if (chains[i].networkName == hre.network.name) {
            currentChain = chains[i];
        }
    }
    if (!currentChain) {
        throw new Error('Chain not supported!');
    }

    let gasLimit = bigInt(0);
    let tx;
    console.log("Deploying Chainlink translator...");
    // const translatorChainlink = await TranslatorChainlink.attach('0x...');
    const translatorChainlink = await TranslatorChainlink.deploy(
        currentChain.id, currentChain.chainType, currentChain.chainlink.chainSelector,
        currentChain.chainlink.baseRouter, currentChain.chainlink.feeToken,
        gasPrice > 0 ? {gasPrice: gasPrice} : {}
    );
    tx = await translatorChainlink.waitForDeployment();
    gasLimit = gasLimit.add((await tx.deploymentTransaction()).gasLimit);
    console.log("Chainlink translator was deployed with address: %s", await translatorChainlink.getAddress());
    tx = await translatorChainlink.addChains(chainIds, chainTypes, chainSelectors);
    gasLimit = gasLimit.add(tx.gasLimit);
    console.log("Chains set successfully");

    const initializer = await Initializer.attach(currentChain?.contractAddresses.initializer.address);

    return {initializer, translatorChainlink, owner, gasLimit};
}

task("chainlink:deploy", "Deploy Chainlink translator")
    .addPositionalParam("systemFee", "System Chainlink relay system fee")
    .addPositionalParam("baseGasLimit", "Chainlink relay base gas limit", '200000')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        const gasPrice = parseInt(taskArgs.gasPrice);
        let {initializer, translatorChainlink, owner, gasLimit} = await deployBase(hre, taskArgs.isTestnet, gasPrice);

        let tx;
        console.log("Setting initializer for translator contract...");
        tx = await translatorChainlink.setInitializer(await initializer.getAddress(), gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);
        console.log("Initializer has been set. Tx: %s", tx.hash);

        tx = await initializer.manageTrustedRelay(await translatorChainlink.getAddress(), 0, taskArgs.systemFee); // mb we should set relayFee
        gasLimit = gasLimit.add(tx.gasLimit);
        console.log("Trusted relay set successfully");

        tx = await translatorChainlink.setBaseGasLimit(taskArgs.baseGasLimit, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", await initializer.getAddress());
        console.log("Chainlink translator address: %s\n", await translatorChainlink.getAddress());
    });
