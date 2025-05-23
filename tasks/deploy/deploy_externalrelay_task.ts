import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import { Chains } from '../base/base_chains';

async function deployBase(hre, relayFee, systemFee, isTestnet, gasPrice) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Translator = await ethers.getContractFactory("AsterizmTranslatorV1");

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

    const initializer = await Initializer.attach(currentChain?.contractAddresses.initializer.address);
    let gasLimit = bigInt(0);
    let tx;
    console.log("Deploying translator...");
    // const translator = await Transalor.attach('0x...');
    const translator = await upgrades.deployProxy(Translator, [currentChain.id, currentChain.chainType], {
        initialize: 'initialize',
        kind: 'uups',
    });
    tx = await translator.waitForDeployment();
    gasLimit = gasLimit.add((await tx.deploymentTransaction()).gasLimit);
    console.log("Translator was deployed with address: %s", await translator.getAddress());
    tx = await translator.addChains(chainIds, chainTypes);
    gasLimit = gasLimit.add(tx.gasLimit);
    console.log("Chains is set");
    console.log("Setting endpoint for translator contract...");
    tx = await translator.setInitializer(await initializer.getAddress(), gasPrice > 0 ? {gasPrice: gasPrice} : {});
    gasLimit = gasLimit.add(tx.gasLimit);
    console.log("Initializer has been set: %s", await initializer.getAddress());

    await initializer.manageTrustedRelay(await translator.getAddress(), relayFee, systemFee);

    return {initializer, translator, owner, gasLimit};
}

task("deploy:externalRelay", "Deploy external relay contracts (internal protocol task, only with Asterizm Protocol pk)")
    .addPositionalParam("relayFee", "External relay fee", '0')
    .addPositionalParam("systemFee", "System fee", '0')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, translator, owner, gasLimit} = await deployBase(hre, taskArgs.relayFee, taskArgs.systemFee, taskArgs.isTestnet, parseInt(taskArgs.gasPrice));

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", await initializer.getAddress());
        console.log("External relay address: %s\n", await translator.getAddress());
    })
