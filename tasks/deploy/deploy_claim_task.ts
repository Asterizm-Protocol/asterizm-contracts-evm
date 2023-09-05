import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(translatorAddress, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
    const translator = await Transalor.attach(translatorAddress);
    const initializer = await Initializer.attach(initializerAddress);

    let gasLimit = BigNumber.from(0);
    return {initializer, translator, owner, gasLimit};
}

task("deploy:claim", "Deploy Asterizm claim contracts")
    .addPositionalParam("translatorAddress", "Translator contract address")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .setAction(async (taskArgs) => {
        let {initializer, translator, owner, gasLimit} = await deployBase(taskArgs.translatorAddress, taskArgs.initializerAddress);

        let tx;
        console.log("Deployig multichain token...");
        const Token = await ethers.getContractFactory("MultichainToken");
        const token = await Token.deploy(initializer.address, ethers.utils.parseEther("1000000"));
        tx = await token.deployed();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);
        console.log("Token was deployed with address: ", token.address);

        console.log("Deployig claimer contract...");
        const Claimer = await ethers.getContractFactory("Claimer");
        const claimer = await Claimer.deploy(token.address);
        tx = await claimer.deployed();
        gasLimit = gasLimit.add(tx.deployTransaction.gasLimit);
        console.log("Claimer was deployed with address: ", claimer.address);

        console.log("Providing claimer contract with funds...");
        tx = await token.transfer(claimer.address, ethers.utils.parseEther("100000"));
        gasLimit = gasLimit.add(tx.gasLimit);
        console.log("Funds has been sent to", claimer.address);
        console.log("Claimer balance: ", await token.balanceOf(claimer.address));
        console.log("Deployer balance: ", await token.balanceOf(owner.address));

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit);
        console.log("Owner address: %s", owner.address);
        console.log("Translator address: %s", translator.address);
        console.log("Initializer address: %s", initializer.address);
        console.log("Multichain token address: %s", token.address);
        console.log("Claimer address: %s\n", claimer.address);
    })
