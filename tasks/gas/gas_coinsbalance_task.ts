import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";
import { Chains } from '../base/base_chains';

async function deployBase(hre, contractAddress) {
    const GasContract = await ethers.getContractFactory("GasStationUpgradeableV1");

    let gasLimit = BigNumber.from(0);
    const gasContract = await GasContract.attach(contractAddress);

    return {gasContract, gasLimit};
}

task("gas:coinsBalance", "Return gassender contract coins balance")
    .addPositionalParam("contractAddress", "GasSender address")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {gasContract, gasLimit} = await deployBase(hre, taskArgs.contractAddress);

        const balance = await ethers.provider.getBalance(gasContract.address);

        console.log("Contract balance: %s\n", balance);
    });
