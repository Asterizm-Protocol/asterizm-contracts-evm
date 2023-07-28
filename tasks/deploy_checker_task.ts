import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(hre, isTestnet, translatorAddress, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");

    let gasLimit = BigNumber.from(0);
    const translator = await Transalor.attach(translatorAddress);
    const initializer = await Initializer.attach(initializerAddress);

    return {initializer, translator, owner, gasLimit};
}

task("deploy:checker", "Deploy Asterizm checker contract")
    .addPositionalParam("translatorAddress", "Translator contract address")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, translator, owner, gasLimit} = await deployBase(hre, taskArgs.isTestnet, taskArgs.translatorAddress, taskArgs.initializerAddress);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Deployig checker contract...");
        const Checker = await ethers.getContractFactory("Checker");
        // const gasStation = await GasStation.attach('0x...');
        const checker = await Checker.deploy(initializer.address, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        tx = await checker.deployed();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);

        console.log("Deployment was done. Wrap up...\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Translator address: %s", translator.address);
        console.log("Initializer address: %s", initializer.address);
        console.log("Checker address: %s\n", checker.address);
    })
