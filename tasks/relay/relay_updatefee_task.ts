import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");

async function deployBase(hre, contractAddress) {
    const [owner] = await ethers.getSigners();
    const Translator = await ethers.getContractFactory("AsterizmTranslatorV1");

    const relay = await Translator.attach(contractAddress);
    let gasLimit = bigInt(0);

    return {relay, owner, gasLimit};
}

task("relay:updateFee", "Update external relay fee")
    .addPositionalParam("contractAddress", "External relay contract address")
    .addPositionalParam("relayFee", "External relay fee")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {relay, owner, gasLimit} = await deployBase(hre, taskArgs.contractAddress);
        const gasPrice = parseInt(taskArgs.gasPrice);

        let tx = await relay.updateTrustedRelayFee(taskArgs.relayFee, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Relay address: %s", await relay.getAddress());
        console.log("Transaction hash: %s\n", tx.hash);
    })
