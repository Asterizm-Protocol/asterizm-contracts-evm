import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import {Chains} from "../base/base_chains";

async function deployBase(hre, isTestnet: number) {
    const [owner] = await ethers.getSigners();
    const Lend = await ethers.getContractFactory("LendingToken");
    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let currentChain = null;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].networkName == hre.network.name) {
            currentChain = chains[i];
            break;
        }
    }
    if (!currentChain) {
        throw new Error('Chain not supported!');
    }

    let gasLimit = bigInt(0);
    const lend = await Lend.attach(currentChain?.trustAddresses.lending.address);

    return {Lend, lend, owner, currentChain, gasLimit};
}

task("lending:send", "Send Lending token")
    .addPositionalParam("stakeId", "Staking ID (in uint)")
    .addPositionalParam("dstChainId", "Destination chain ID")
    .addPositionalParam("dstAddress", "Destination address (in bytes)")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {Lend, lend, owner, currentChain, gasLimit} = await deployBase(hre, taskArgs.isTestnet);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Unstaking tokens...");

        tx = await lend.crossChainUnstake(taskArgs.dstChainId, owner.address, taskArgs.dstAddress, taskArgs.stakeId, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Tokens unstaking was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Lending token address: %s", await lend.getAddress());
        console.log("Transaction hash: %s\n", tx.hash);
    })
