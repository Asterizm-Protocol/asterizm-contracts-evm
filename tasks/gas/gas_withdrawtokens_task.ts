import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");

async function deployBase(hre, contractAddress) {
    const GasContract = await ethers.getContractFactory("GasStationUpgradeableV1");

    let gasLimit = bigInt(0);
    const gasContract = await GasContract.attach(contractAddress);

    return {gasContract, gasLimit};
}

task("gas:withdrawTokens", "Withdraw tokens from gassender contract")
    .addPositionalParam("contractAddress", "GasSender address")
    .addPositionalParam("tokenAddress", "Token address")
    .addPositionalParam("targetAddress", "Target address")
    .addPositionalParam("amount", "Withdrawal amount")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {gasContract, gasLimit} = await deployBase(hre, taskArgs.contractAddress);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Withdrawing tokens...");
        let tx = await gasContract.withdrawNotExistsTokens(taskArgs.tokenAddress, taskArgs.targetAddress, taskArgs.amount, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("\nTokens withdrawal successfully\n");

        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Transaction hash: %s\n", tx.hash);
    });
