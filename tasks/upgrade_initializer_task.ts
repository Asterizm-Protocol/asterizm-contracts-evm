import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";
import { Chains } from './base/base_chains';

async function deployBase(hre, implementationVersion) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV" + implementationVersion);
    let gasLimit = BigNumber.from(0);

    return {owner, Initializer, gasLimit};
}

task("upgrade:initializer", "Update Asterizm Initialozer contracts")
    .addPositionalParam("proxyAddress", "Initializer proxy contract address")
    .addPositionalParam("implementationVersion", "Implementation version", '1')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {owner, Initializer, gasLimit} = await deployBase(hre, taskArgs.implementationVersion);

        console.log("Upgrading gas station implementation...");

        const initializer = await upgrades.upgradeProxy(taskArgs.proxyAddress, Initializer);
        gasLimit = gasLimit.add(initializer.deployTransaction.gasLimit);
        console.log("Initializer implementation upgrade successfully");

        console.log("Deployment was done. Wrap up...\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s\n", initializer.address);
    });
