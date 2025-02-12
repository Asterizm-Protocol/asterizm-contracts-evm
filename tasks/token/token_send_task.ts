import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import {Chains} from "../base/base_chains";

async function deployBase(hre, isTestnet: number) {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("OmniChainToken");
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
    const token = await Token.attach(currentChain?.trustAddresses.multichain.address);

    return {Token, token, owner, currentChain, gasLimit};
}

task("token-base:send", "Send base OmniChain token")
    .addPositionalParam("dstChainId", "Destination chain ID")
    .addPositionalParam("dstAddress", "Destination address (in uint)")
    .addPositionalParam("amount", "Token transfer amount (with decimals)")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {Token, token, owner, currentChain, gasLimit} = await deployBase(hre, taskArgs.isTestnet);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Sending tokens...");

        tx = await token.crossChainTransfer(taskArgs.dstChainId, owner.address, taskArgs.dstAddress, taskArgs.amount, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Tokens sending was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Multichain token address: %s", await token.getAddress());
        console.log("Transaction hash: %s\n", tx.hash);
    })
