import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");

async function deployBase(hre, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");

    let gasLimit = bigInt(0);
    const initializer = await Initializer.attach(initializerAddress);

    return {initializer, owner, gasLimit};
}

task("lending:deploy", "Deploy Lending token contract")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("initSupply", "Initial token supply", '0')
    .addPositionalParam("relayAddress", "Config contract address", '0')
    .addPositionalParam("feeTokenAddress", "Chainlink fee token address", '0')
    .addPositionalParam("refundFee", "Refund fee in native coins", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, owner, gasLimit} = await deployBase(hre, taskArgs.initializerAddress);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Deploying lending token contract...");
        const Lend = await ethers.getContractFactory("LendingToken");
        const lend = await Lend.deploy(await initializer.getAddress(), bigInt(taskArgs.initSupply).toString(), gasPrice > 0 ? {gasPrice: gasPrice} : {});
        tx = await lend.waitForDeployment();
        gasLimit = gasLimit.add((await tx.deploymentTransaction()).gasLimit);
        if (taskArgs.relayAddress != '0') {
            tx = await lend.setExternalRelay(taskArgs.relayAddress, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            // gasLimit = gasLimit.add(tx.gasLimit);
            console.log("Set external relay successfully. Address: %s", taskArgs.relayAddress);
        }
        if (taskArgs.feeTokenAddress != '0') {
            tx = await lend.setFeeToken(taskArgs.feeTokenAddress, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            // gasLimit = gasLimit.add(tx.gasLimit);
            console.log("Set fee token successfully. Address: %s", taskArgs.feeTokenAddress);
        }

        if (taskArgs.refundFee != '0') {
            tx = await lend.setRefundFee(taskArgs.refundFee, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            // gasLimit = gasLimit.add(tx.gasLimit);
            console.log("Set refund fee successfully. Hash: %s", tx.hash);
        }

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", await initializer.getAddress());
        if (taskArgs.relayAddress != '0') {
            console.log("External relay address: %s", taskArgs.relayAddress);
        }
        console.log("Lending token address: %s\n", await lend.getAddress());
    })
