import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import { Chains } from '../base/base_chains';

async function deployBase(hre, isTestnet) {
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
        throw new Error('Chain not supported!');
    }

    let gasLimit = bigInt(0);
    const initializer = await Initializer.attach(currentChain?.contractAddresses.initializer.address);

    return {initializer, owner, currentChain, gasLimit};
}

task("deploy:gas", "Deploy Asterizm gassender contracts")
    .addPositionalParam("minUsdAmount", "Min transfer amount in USD", '0')
    .addPositionalParam("maxUsdAmount", "Max transfer amount in USD", '0')
    .addPositionalParam("minUsdAmountPerChain", "Min transfer amount in USD per chain", '0')
    .addPositionalParam("maxUsdAmountPerChain", "Max transfer amount in USD per chain", '0')
    .addPositionalParam("relayAddress", "Config contract address", '0')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, owner, currentChain, gasLimit} = await deployBase(hre, taskArgs.isTestnet);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Deploying gas station contract...");
        const GasStation = await ethers.getContractFactory("GasStationUpgradeableV1");
        // const gasStation = await GasStation.attach('0x...');
        // const gasStation = await GasStation.deploy(await initializer.getAddress(), useForceOrder, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        const gasStation = await upgrades.deployProxy(GasStation, [await initializer.getAddress()], {
            initialize: 'initialize',
            kind: 'uups',
        });
        tx = await gasStation.waitForDeployment();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);
        console.log("Gas station was deployed with address: %s", await gasStation.getAddress());
        if (taskArgs.minUsdAmount != '0') {
            tx = await gasStation.setMinUsdAmount(taskArgs.minUsdAmount, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
        }
        if (taskArgs.maxUsdAmount != '0') {
            tx = await gasStation.setMaxUsdAmount(taskArgs.maxUsdAmount, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
        }
        if (taskArgs.minUsdAmountPerChain != '0') {
            tx = await gasStation.setMinUsdAmountPerChain(taskArgs.minUsdAmountPerChain, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
        }
        if (taskArgs.maxUsdAmountPerChain != '0') {
            tx = await gasStation.setMaxUsdAmountPerChain(taskArgs.maxUsdAmountPerChain, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
        }
        for (let i = 0; i < currentChain.stableCoins.length; i++) {
            tx = await gasStation.addStableCoin(currentChain.stableCoins[i], gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
        }
        console.log("Added stable coins");
        if (taskArgs.relayAddress != '0') {
            tx = await gasStation.setExternalRelay(taskArgs.relayAddress, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
            console.log("Set external relay successfully. Address: %s", taskArgs.relayAddress);
        }

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", await initializer.getAddress());
        if (taskArgs.relayAddress != '0') {
            console.log("External relay address: %s", taskArgs.relayAddress);
            console.log("Gas station address: %s\n", await gasStation.getAddress());
        } else {
            console.log("Gas station address: %s\n", await gasStation.getAddress());
        }
    })
