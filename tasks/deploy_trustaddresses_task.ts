import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";
import { Chains } from './base/base_chains';

async function deployBase(isTestnet, contractAddress, contractType) {
    const TargetContract = await ethers.getContractFactory(contractType == "multichain" ? "MultichainToken" : "GasStation");

    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let chainIds = [];
    let trustedAddresses = [];
    for (let i = 0; i < chains.length; i++) {
        chainIds.push(chains[i].id);
        if (contractType == "multichain") {
            trustedAddresses.push(chains[i].trustAddresses.multichain);
        } else {
            trustedAddresses.push(chains[i].trustAddresses.gas);
        }
    }

    let gasLimit = BigNumber.from(0);
    const targetContract = await TargetContract.attach(contractAddress);

    return {targetContract, gasLimit, chainIds, trustedAddresses};
}

task("deploy:trustedAddress", "Add trust addresses to client contract")
    .addPositionalParam("contractAddress", "Target contract address (gas, multichain, etc)")
    .addPositionalParam("contractType", "Target contract type (gas - gassender contract, claim - claim contract)", "gas")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .setAction(async (taskArgs) => {
        let {targetContract, gasLimit, chainIds, trustedAddresses} = await deployBase(taskArgs.isTestnet, taskArgs.contractAddress, taskArgs.contractType);

        const gasPrice = 0;
        console.log("Adding contract trusted address...");
        console.log("Params:");
        console.log({ChainIds: chainIds, TrustedAddresses: trustedAddresses});
        let tx = await targetContract.addTrustedAddresses(chainIds, trustedAddresses, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("\nAdded trusted address successfully\n");

        console.log("Total gas limit: %s", gasLimit);
        console.log("Target contract address: %s\n", targetContract.address);
    })
