import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(hre, implementationVersion) {
    const [owner] = await ethers.getSigners();
    const GasStation = await ethers.getContractFactory("GasStationUpgradeableV" + implementationVersion);
    let gasLimit = BigNumber.from(0);

    return {owner, GasStation, gasLimit};
}

task("upgrade:gas", "Update Asterizm GasSender contracts")
    .addPositionalParam("proxyAddress", "GasSender proxy contract address")
    .addPositionalParam("implementationVersion", "Implementation version", '1')
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {owner, GasStation, gasLimit} = await deployBase(hre, taskArgs.implementationVersion);

        console.log("Upgrading gas station implementation...");

        const gasStation = await upgrades.upgradeProxy(taskArgs.proxyAddress, GasStation);
        gasLimit = gasLimit.add(gasStation.deployTransaction.gasLimit);
        console.log("GasStation implementation upgrade successfully");

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Gas station address: %s\n", gasStation.address);
    });
