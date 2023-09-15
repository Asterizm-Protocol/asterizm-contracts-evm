import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(hre, implementationVersion) {
    const [owner] = await ethers.getSigners();
    const Translator = await ethers.getContractFactory("AsterizmTranslatorV" + implementationVersion);
    let gasLimit = BigNumber.from(0);

    return {owner, Translator, gasLimit};
}

task("upgrade:translator", "Update Asterizm Translator contracts")
    .addPositionalParam("proxyAddress", "Translator proxy contract address")
    .addPositionalParam("implementationVersion", "Implementation version", '1')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {owner, Translator, gasLimit} = await deployBase(hre, taskArgs.implementationVersion);

        console.log("Upgrading translator implementation...");

        const translator = await upgrades.upgradeProxy(taskArgs.proxyAddress, Translator);
        gasLimit = gasLimit.add(translator.deployTransaction.gasLimit);
        console.log("Translator implementation upgrade successfully");

        console.log("Updating was done. Wrap up...\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Translator address: %s\n", translator.address);
    });
