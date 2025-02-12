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

task("token-stake-token:deploy-upgrade", "Deploy base OmniChain token contract (upgradeable)")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("stakeTokenAddress", "Stake token address")
    .addPositionalParam("initSupply", "Initial token supply", '0')
    .addPositionalParam("relayAddress", "Config contract address", '0')
    .addPositionalParam("feeTokenAddress", "Chainlink fee token address", '0')
    .addPositionalParam("refundFee", "Refund fee in native coins", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, owner, gasLimit} = await deployBase(hre, taskArgs.initializerAddress);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Deploying token contract...");
        const Token = await ethers.getContractFactory("OmniChainStakeTokenUpgradeableV1");
        const token = await upgrades.deployProxy(Token, [await initializer.getAddress(), bigInt(taskArgs.initSupply).toString(), taskArgs.stakeTokenAddress], {
            initialize: 'initialize',
            kind: 'uups',
        });
        tx = await token.waitForDeployment();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);
        if (taskArgs.relayAddress != '0') {
            tx = await token.setExternalRelay(taskArgs.relayAddress, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
            console.log("Set external relay successfully. Address: %s", taskArgs.relayAddress);
        }
        if (taskArgs.feeTokenAddress != '0') {
            tx = await token.setFeeToken(taskArgs.feeTokenAddress, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
            console.log("Set fee token successfully. Address: %s", taskArgs.feeTokenAddress);
        }

        if (taskArgs.refundFee != '0') {
            tx = await token.setRefundFee(taskArgs.refundFee, gasPrice > 0 ? {gasPrice: gasPrice} : {});
            gasLimit = gasLimit.add(tx.gasLimit);
            console.log("Set refund fee successfully. Hash: %s", tx.hash);
        }

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", await initializer.getAddress());
        if (taskArgs.relayAddress != '0') {
            console.log("External relay address: %s", taskArgs.relayAddress);
        }
        console.log("Stake token OmniChain token address: %s\n", await token.getAddress());
    })
