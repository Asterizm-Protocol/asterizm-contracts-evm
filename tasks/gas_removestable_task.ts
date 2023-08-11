import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(hre, contractAddress) {
    const GasContract = await ethers.getContractFactory("GasStationUpgradeableV1");

    let gasLimit = BigNumber.from(0);
    const gasContract = await GasContract.attach(contractAddress);

    return {gasContract, gasLimit};
}

task("gas:removeStableCoin", "Remove stable coin from from gassender contract")
    .addPositionalParam("contractAddress", "GasSender address")
    .addPositionalParam("stableAddress", "Stable coin address")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {gasContract, gasLimit} = await deployBase(hre, taskArgs.contractAddress);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Removing stable coin from contract...");
        let tx = await gasContract.removeStableCoin(taskArgs.stableAddress, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("\nStable coins removed successfully\n");

        console.log("Total gas limit: %s", gasLimit);
        console.log("Transaction hash: %s\n", tx.hash);
    });
