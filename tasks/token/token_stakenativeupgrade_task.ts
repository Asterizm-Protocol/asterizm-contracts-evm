import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import {Chains} from "../base/base_chains";

async function deployBase(hre, implementationVersion, isTestnet) {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("OmniChainStakeNativeUpgradeableV" + implementationVersion);
    let gasLimit = bigInt(0);

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

    return {owner, Token, gasLimit, currentChain};
}

task("token-stake-native:upgrade", "Update stake native OmniChain token contracts")
    .addPositionalParam("address", "Deployed token contract address")
    .addPositionalParam("implementationVersion", "Implementation version", '1')
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {owner, Token, gasLimit, currentChain} = await deployBase(hre, taskArgs.implementationVersion, taskArgs.isTestnet);

        console.log("Upgrading stake native OmniChain token implementation...");

        const token = await upgrades.upgradeProxy(currentChain.trustAddresses.gas.address, Token);
        gasLimit = gasLimit.add(token.deployTransaction.gasLimit);
        console.log("Stake native OmniChain token implementation upgrade successfully");

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("OmniChain token address: %s", await token.getAddress());
        console.log("Transaction hash: %s\n", token.deployTransaction.hash);
    });
