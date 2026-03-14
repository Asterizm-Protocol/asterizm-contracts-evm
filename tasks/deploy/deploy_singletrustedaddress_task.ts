import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");
import { Chains } from "../base/base_chains";

async function deployBase(hre, contractAddress, contractType, isTestnet) {
    const chains = isTestnet == 1 ? Chains.testnet : Chains.mainnet;

    let TargetContract;
    if (contractType == "multichain") {
        TargetContract = await ethers.getContractFactory("OmniChainToken");
    } else if (contractType == "checker") {
        TargetContract = await ethers.getContractFactory("Checker");
    } else if (contractType == "demo") {
        TargetContract = await ethers.getContractFactory("AsterizmDemo");
    } else if (contractType == "gas") {
        TargetContract = await ethers.getContractFactory("GasStationUpgradeableV1");
    } else if (contractType == "cantonNft") {
        TargetContract = await ethers.getContractFactory("CantonNftUpgradeableV1");
    } else if (contractType == "lending.base") {
        TargetContract = await ethers.getContractFactory("LendingBase");
    } else if (contractType == "lending.token") {
        TargetContract = await ethers.getContractFactory("LendingToken");
    }

    if (!TargetContract) {
        throw new Error('Wrong contractType!');
    }

    let currentChain = null;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].networkName == hre.network.name) {
            currentChain = chains[i];
            break;
        }
    }

    let trustedAddress;
    if (contractType == "lending.base") {
        trustedAddress = currentChain?.trustAddresses.lending.base.address;
    } else if (contractType == "lending.token") {
        trustedAddress = currentChain?.trustAddresses.lending.token.address;
    } else {
        trustedAddress = currentChain?.trustAddresses[contractType].address;
    }

    let gasLimit = bigInt(0);
    const targetContract = await TargetContract.attach(trustedAddress);

    return {targetContract, gasLimit};
}

task("deploy:addTrustedAddress", "Adding trusted address to client contract")
    // .addPositionalParam("contractAddress", "Target contract address")
    .addPositionalParam("trustedChainId", "Trusted chain ID")
    .addPositionalParam("trustedAddress", "Trusted address")
    .addPositionalParam("contractType", "Target contract type (gas - gassender contract, claim - claim contract, checker - checker contract, demo - demo contract, multichain - multichain token contract, cantonNft - canton NFT contract, lending.base - base lending contract, lending.token - lending token contract)", "gas")
    .addPositionalParam("isTestnet", "Is testnet flag (1 - testnet, 0 - mainnet)", '0')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {targetContract, gasLimit} = await deployBase(hre, taskArgs.contractAddress, taskArgs.contractType, taskArgs.isTestnet);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Adding contract trusted address...");
        let tx = await targetContract.addTrustedAddresses([taskArgs.trustedChainId], [taskArgs.trustedAddress], gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("Added trusted address successfully\n");

        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Target contract address: %s", await targetContract.getAddress());
        console.log("Transaction hash: %s\n", tx.hash);
    })
