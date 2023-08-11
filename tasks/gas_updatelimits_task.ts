import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";
import { Chains } from './base/base_chains';

async function deployBase(hre, isTestnet) {
    const GasContract = await ethers.getContractFactory("GasStationUpgradeableV1");

    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;
    let currentChain = null;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].networkName == hre.network.name) {
            currentChain = chains[i];
        }
    }

    let gasLimit = BigNumber.from(0);
    const gasStation = await GasContract.attach(currentChain.trustAddresses.gas.address);

    return {gasStation, gasLimit};
}

task("deploy:updateLimits", "Deploy Asterizm gassender contracts")
    .addPositionalParam("minUsdAmount", "Minimum transfer amount in USD", '0')
    .addPositionalParam("maxUsdAmount", "Maximum transfer amount in USD", '0')
    .addPositionalParam("minUsdAmountPerChain", "Minimum transfer amount in USD per chain", '0')
    .addPositionalParam("maxUsdAmountPerChain", "Minimum transfer amount in USD per chain", '0')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {gasStation, gasLimit} = await deployBase(hre, taskArgs.isTestnet);

        console.log("Updating gas limits...");
        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        if (taskArgs.minUsdAmount != '0') {
            tx = await gasStation.setMinUsdAmount(taskArgs.minUsdAmount, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
            console.log("MinUsdAmount updated successfully");
            console.log("Transaction hash: %s", tx.hash);
        }

        if (taskArgs.maxUsdAmount != '0') {
            tx = await gasStation.setMaxUsdAmount(taskArgs.maxUsdAmount, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
            console.log("MaxUsdAmount updated successfully",);
            console.log("Transaction hash: %s", tx.hash);
        }

        if (taskArgs.minUsdAmountPerChain != '0') {
            tx = await gasStation.setMinUsdAmountPerChain(taskArgs.minUsdAmountPerChain, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
            console.log("MinUsdAmountPerChain updated successfully",);
            console.log("Transaction hash: %s", tx.hash);
        }

        if (taskArgs.maxUsdAmountPerChain != '0') {
            tx = await gasStation.setMaxUsdAmountPerChain(taskArgs.maxUsdAmountPerChain, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
            console.log("MaxUsdAmountPerChain updated successfully",);
            console.log("Transaction hash: %s", tx.hash);
        }

        console.log("Updating was done\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Gas station address: %s\n", gasStation.address);
    })
