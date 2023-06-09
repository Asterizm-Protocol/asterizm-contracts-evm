import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";
import { Chains } from './base/base_chains';

async function deployBase(isTestnet, translatorAddress, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializer");
    const Transalor = await ethers.getContractFactory("AsterizmTranslator");

    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let currentChain;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].isCurrent) {
            currentChain = chains[i];
        }
    }

    let gasLimit = BigNumber.from(0);
    const translator = await Transalor.attach(translatorAddress);
    const initializer = await Initializer.attach(initializerAddress);

    return {initializer, translator, owner, currentChain, gasLimit};
}

task("deploy:gas", "Deploy Asterizm gassender contracts")
    .addPositionalParam("translatorAddress", "Translator contract address")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs) => {
        let {initializer, translator, owner, currentChain, gasLimit} = await deployBase(taskArgs.isTestnet, taskArgs.translatorAddress, taskArgs.initializerAddress);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        const minUsdAmount = 100; // change minUsdAmount here
        const useForceOrder = false; // change useForceOrder here
        console.log("Deployig gas station contract...");
        const GasStation = await ethers.getContractFactory("GasStation");
        const gasStation = await GasStation.deploy(initializer.address, useForceOrder, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        tx = await gasStation.deployed();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);
        console.log("Gas station was deployed with address: %s", gasStation.address);
        tx = await gasStation.setMinUsdAmount(minUsdAmount, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);
        for (let i = 0; i < currentChain.stableCoins.length; i++) {
            tx = await gasStation.addStableCoin(currentChain.stableCoins[i], gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
        }
        console.log("Added stable coins");

        console.log("Deployment was done. Wrap up...\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Translator address: %s", translator.address);
        console.log("Initializer address: %s", initializer.address);
        console.log("Gas station address: %s\n", gasStation.address);
    })
