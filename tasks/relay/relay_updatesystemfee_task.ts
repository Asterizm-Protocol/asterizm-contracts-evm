import "@nomicfoundation/hardhat-toolbox";
// import { upgrades } from 'hardhat';
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(hre, initializerAddress, relayAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Translator = await ethers.getContractFactory("AsterizmTranslatorV1");

    const initializer = await Initializer.attach(initializerAddress);
    const relay = await Translator.attach(relayAddress);
    let gasLimit = BigNumber.from(0);

    return {initializer, relay, owner, gasLimit};
}

task("relay:updateSystemFee", "Update external relay system fee (internal protocol task, only with Asterizm Protocol pk)")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("relayAddress", "External relay contract address")
    .addPositionalParam("systemFee", "System relay fee")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, relay, owner, gasLimit} = await deployBase(hre, taskArgs.initializerAddress, taskArgs.relayAddress);
        const gasPrice = parseInt(taskArgs.gasPrice);

        const relayData = await initializer.getRelayData(relay.address);

        let tx = await initializer.manageTrustedRelay(relay.address, relayData.externalRelayFee, taskArgs.systemFee, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Relay address: %s", relay.address);
        console.log("Transaction hash: %s\n", tx.hash);
    })
