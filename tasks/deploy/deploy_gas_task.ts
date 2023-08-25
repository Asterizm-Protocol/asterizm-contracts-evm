import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";
import { Chains } from '../base/base_chains';

async function deployBase(hre, isTestnet, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");

    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let currentChain;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].networkName == hre.network.name) {
            currentChain = chains[i];
        }
    }
    if (!currentChain) {
        currentChain = chains[0];
    }

    let gasLimit = BigNumber.from(0);
    const initializer = await Initializer.attach(initializerAddress);

    return {initializer, owner, currentChain, gasLimit};
}

task("deploy:gas", "Deploy Asterizm gassender contracts")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, owner, currentChain, gasLimit} = await deployBase(hre, taskArgs.isTestnet, taskArgs.initializerAddress);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        const minUsdAmount = 15; // change minUsdAmount here
        const maxUsdAmount = 200; // change maxUsdAmount here
        const minUsdAmountPerChain = 10; // change minUsdAmountPerChain here
        const useForceOrder = false; // change useForceOrder here
        console.log("Deployig gas station contract...");
        const GasStation = await ethers.getContractFactory("GasStationUpgradeableV1");
        // const gasStation = await GasStation.attach('0x...');
        // const gasStation = await GasStation.deploy(initializer.address, useForceOrder, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        const gasStation = await upgrades.deployProxy(GasStation, [initializer.address, useForceOrder], {
            initialize: 'initialize',
            kind: 'uups',
        });
        tx = await gasStation.deployed();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);
        console.log("Gas station was deployed with address: %s", gasStation.address);
        tx = await gasStation.setMinUsdAmount(minUsdAmount, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);
        tx = await gasStation.setMaxUsdAmount(maxUsdAmount, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);
        tx = await gasStation.setMinUsdAmountPerChain(minUsdAmountPerChain, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);
        for (let i = 0; i < currentChain.stableCoins.length; i++) {
            tx = await gasStation.addStableCoin(currentChain.stableCoins[i], gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
        }
        console.log("Added stable coins");

        console.log("Deployment was done. Wrap up...\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", initializer.address);
        console.log("Gas station address: %s\n", gasStation.address);
    })