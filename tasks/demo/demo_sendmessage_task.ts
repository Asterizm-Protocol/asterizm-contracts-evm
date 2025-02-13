import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");

async function deployBase(contractAddress) {
    let TargetContract = await ethers.getContractFactory("AsterizmDemo");

    let gasLimit = bigInt(0);
    const targetContract = await TargetContract.attach(contractAddress);

    return {targetContract, gasLimit};
}

task("demo:sendmessage", "Send crosschain message with AdterizmDemo contract")
    .addPositionalParam("contractAddress", "Demo contract address on source chain")
    .addPositionalParam("destinationChainId", "Destination chain ID")
    .addPositionalParam("message", "Transfer message")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs) => {
        let {targetContract, gasLimit} = await deployBase(taskArgs.contractAddress);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Sending message...");
        let tx = await targetContract.sendMessage(taskArgs.destinationChainId, taskArgs.message, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("\nMessage sent successfully\n");

        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("AsterizmDemo address: %s", await targetContract.getAddress());
        console.log("Transaction hash: %s\n", tx.hash);
    })
