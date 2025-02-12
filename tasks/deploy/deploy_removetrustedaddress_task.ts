import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");

async function deployBase(contractAddress, contractType) {
    let TargetContract;
    if (contractType == "multichain") {
        TargetContract = await ethers.getContractFactory("OmniChainToken");
    } else if (contractType == "checker") {
        TargetContract = await ethers.getContractFactory("Checker");
    } else {
        TargetContract = await ethers.getContractFactory("GasStationUpgradeableV1");
    }

    let gasLimit = bigInt(0);
    const targetContract = await TargetContract.attach(contractAddress);

    return {targetContract, gasLimit};
}

task("deploy:removeTrustedAddress", "Remove trust address by chain id from client contract")
    .addPositionalParam("contractAddress", "Target contract address (gas, multichain, etc)")
    .addPositionalParam("contractType", "Target contract type (gas - gassender contract, claim - claim contract, checker - checker contract)")
    .addPositionalParam("chainId", "Trusted chain ID")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs) => {
        let {targetContract, gasLimit} = await deployBase(taskArgs.contractAddress, taskArgs.contractType);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Removing trusted address...");
        let tx = await targetContract.removeTrustedAddress(taskArgs.chainId, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("\nRemoved trusted address successfully\n");

        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Target contract address: %s", await targetContract.getAddress());
        console.log("Transaction hash: %s\n", tx.hash);
    })
