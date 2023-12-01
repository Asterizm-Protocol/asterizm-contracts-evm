import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";
import { Chains } from "../base/base_chains";

async function deployBase(hre, contractAddress, contractType, isTestnet) {
    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let TargetContract;
    if (contractType == "multichain") {
        TargetContract = await ethers.getContractFactory("MultichainToken");
    } else if (contractType == "checker") {
        TargetContract = await ethers.getContractFactory("Checker");
    } else if (contractType == "demo") {
        TargetContract = await ethers.getContractFactory("AsterizmDemo");
    } else {
        TargetContract = await ethers.getContractFactory("GasStationUpgradeableV1");
    }

    let currentChain = null;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].networkName == hre.network.name) {
            currentChain = chains[i];
            break;
        }
    }

    let gasLimit = BigNumber.from(0);
    const targetContract = await TargetContract.attach(currentChain?.trustAddresses[contractType].address);

    return {targetContract, gasLimit};
}

task("deploy:addTrustedAddress", "Adding trusted address to client contract")
    // .addPositionalParam("contractAddress", "Target contract address")
    .addPositionalParam("trustedChainId", "Trusted chain ID")
    .addPositionalParam("trustedAddress", "Trusted address")
    .addPositionalParam("contractType", "Target contract type (gas - gassender contract, claim - claim contract, checker - checker contract, demo - demo contract)", "gas")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {targetContract, gasLimit} = await deployBase(hre, taskArgs.contractAddress, taskArgs.contractType, taskArgs.isTestnet);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Adding contract trusted address...");
        let tx = await targetContract.addTrustedAddresses([taskArgs.trustedChainId], [taskArgs.trustedAddress], gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Added trusted address successfully\n");

        console.log("Total gas limit: %s", gasLimit);
        console.log("Target contract address: %s", targetContract.address);
        console.log("Transaction hash: %s\n", tx.hash);
    })
