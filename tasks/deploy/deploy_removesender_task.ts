import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import { Chains } from "../base/base_chains";

async function deployBase(hre, contractAddress) {
    let TargetContract = await ethers.getContractFactory("OmniChainToken");

    let gasLimit = bigInt(0);
    const targetContract = await TargetContract.attach(contractAddress);

    return {targetContract, gasLimit};
}

task("deploy:removeSender", "Removing sender from client contract")
    .addPositionalParam("contractAddress", "Target contract address")
    .addPositionalParam("senderAddress", "Sender address")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {targetContract, gasLimit} = await deployBase(hre, taskArgs.contractAddress);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Removing contract sender...");
        let tx = await targetContract.removeSender(taskArgs.senderAddress, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Sender removed successfully\n");

        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Target contract address: %s", await targetContract.getAddress());
        console.log("Transaction hash: %s\n", tx.hash);
    })
