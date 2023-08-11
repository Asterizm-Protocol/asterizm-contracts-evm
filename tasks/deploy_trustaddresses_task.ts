import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";
import { Chains } from './base/base_chains';

async function deployBase(hre, isTestnet, contractType) {
    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let TargetContract;
    let chainIds = [];
    let trustedAddresses = [];
    let currentChain = null;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].networkName == hre.network.name) {
            currentChain = chains[i];
        }

        if (contractType == "multichain") {
            TargetContract = await ethers.getContractFactory("MultichainToken");
            if (chains[i].trustAddresses.multichain.address == '0x0000000000000000000000000000000000000000') {
                continue;
            }

            trustedAddresses.push(chains[i].trustAddresses.multichain.uint);
            chainIds.push(chains[i].id);
        } else if (contractType == "checker") {
            TargetContract = await ethers.getContractFactory("Checker");
            if (chains[i].trustAddresses.checker.address == '0x0000000000000000000000000000000000000000') {
                continue;
            }

            trustedAddresses.push(chains[i].trustAddresses.checker.uint);
            chainIds.push(chains[i].id);
        } else {
            TargetContract = await ethers.getContractFactory("GasStationUpgradeableV1");
            if (chains[i].trustAddresses.gas.address == '0x0000000000000000000000000000000000000000') {
                continue;
            }

            trustedAddresses.push(chains[i].trustAddresses.gas.uint);
            chainIds.push(chains[i].id);
        }
    }

    let gasLimit = BigNumber.from(0);
    const targetContract = await TargetContract.attach(currentChain.trustAddresses[contractType].address);

    return {targetContract, gasLimit, chainIds, trustedAddresses};
}

task("deploy:trustedAddress", "Add trust addresses to client contract")
    .addPositionalParam("contractType", "Target contract type (gas - gassender contract, claim - claim contract, checker - checker contract)", "gas")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {targetContract, gasLimit, chainIds, trustedAddresses} = await deployBase(hre, taskArgs.isTestnet, taskArgs.contractType);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Adding contract trusted address...");
        console.log("Params:");
        console.log({ChainIds: chainIds, TrustedAddresses: trustedAddresses});
        let tx = await targetContract.addTrustedAddresses(chainIds, trustedAddresses, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("\nAdded trusted address successfully\n");

        console.log("Total gas limit: %s", gasLimit);
        console.log("Target contract address: %s", targetContract.address);
        console.log("Transaction hash: %s\n", tx.hash);
    })
