import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(hre, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");

    let gasLimit = BigNumber.from(0);
    const initializer = await Initializer.attach(initializerAddress);

    return {initializer, owner, gasLimit};
}

task("demo:deploy", "Deploy AsterizmDemo contract")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {initializer, owner, gasLimit} = await deployBase(hre, taskArgs.initializerAddress);

        let tx;
        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Deployig checker contract...");
        const Demo = await ethers.getContractFactory("AsterizmDemo");
        const demo = await Demo.deploy(initializer.address, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        tx = await demo.deployed();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);

        console.log("Deployment was done. Wrap up...\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Initializer address: %s", initializer.address);
        console.log("AsterizmDemo address: %s\n", demo.address);
    })