import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(hre, contractAddress) {
    const GasContract = await ethers.getContractFactory("GasStation");

    let gasLimit = BigNumber.from(0);
    const gasContract = await GasContract.attach(contractAddress);

    return {gasContract, gasLimit};
}

task("gas:withdrawCoins", "Withdraw coins from gassender contract")
    .addPositionalParam("contractAddress", "GasSender address")
    .addPositionalParam("targetAddress", "Target address")
    .addPositionalParam("amount", "Withdrawal amount")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {gasContract, gasLimit} = await deployBase(hre, taskArgs.contractAddress);

        const beforeBalance = await ethers.provider.getBalance(gasContract.address);
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Adding contract trusted address...");
        let tx = await gasContract.withdrawCoins(taskArgs.targetAddress, taskArgs.amount, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);
        const afterBalance = await ethers.provider.getBalance(gasContract.address);

        console.log("\nCoins withdrawal successfully\n");

        console.log("Total gas limit: %s", gasLimit);
        console.log("Before balance: %s", beforeBalance);
        console.log("After balance: %s", afterBalance);
        console.log("Transaction hash: %s\n", tx.hash);
    });
