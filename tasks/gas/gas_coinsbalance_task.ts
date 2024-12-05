import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");

async function deployBase(hre, contractAddress) {
    const GasContract = await ethers.getContractFactory("GasStationUpgradeableV1");

    let gasLimit = bigInt(0);
    const gasContract = await GasContract.attach(contractAddress);

    return {gasContract, gasLimit};
}

task("gas:coinsBalance", "Return gassender contract coins balance")
    .addPositionalParam("contractAddress", "GasSender address")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {gasContract, gasLimit} = await deployBase(hre, taskArgs.contractAddress);

        const balance = await ethers.provider.getBalance(await gasContract.getAddress());

        console.log("Contract balance: %s\n", balance);
    });
