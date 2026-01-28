import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import {Chains} from "../base/base_chains";

async function deployBase(hre, isTestnet: number) {
    const [owner] = await ethers.getSigners();
    const Stake = await ethers.getContractFactory("StakingToken");
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
    const stake = await Stake.attach(currentChain?.trustAddresses.staking.address);

    return {Stake, stake, owner, currentChain, gasLimit};
}

task("staking:send", "Send Staking token")
    .addPositionalParam("stakeId", "Staking ID (in uint)")
    .addPositionalParam("dstChainId", "Destination chain ID")
    .addPositionalParam("dstAddress", "Destination address (in bytes)")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {Stake, stake, owner, currentChain, gasLimit} = await deployBase(hre, taskArgs.isTestnet);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Unstaking tokens...");

        tx = await stake.crossChainUnstake(taskArgs.dstChainId, owner.address, taskArgs.dstAddress, taskArgs.stakeId, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Tokens unstaking was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Staking token address: %s", await stake.getAddress());
        console.log("Transaction hash: %s\n", tx.hash);
    })
