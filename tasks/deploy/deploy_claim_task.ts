import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
const bigInt = require("big-integer");

async function deployBase(translatorAddress, initializerAddress) {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializerV1");
    const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
    const translator = await Transalor.attach(translatorAddress);
    const initializer = await Initializer.attach(initializerAddress);

    let gasLimit = bigInt(0);
    return {initializer, translator, owner, gasLimit};
}

task("deploy:claim", "Deploy Asterizm claim contracts")
    .addPositionalParam("translatorAddress", "Translator contract address")
    .addPositionalParam("initializerAddress", "Initializer contract address")
    .setAction(async (taskArgs) => {
        let {initializer, translator, owner, gasLimit} = await deployBase(taskArgs.translatorAddress, taskArgs.initializerAddress);

        let tx;
        console.log("Deployig multichain token...");
        const Token = await ethers.getContractFactory("OmniChainToken");
        const token = await Token.deploy(await initializer.getAddress(), ethers.utils.parseEther("1000000"));
        tx = await token.waitForDeployment();
        gasLimit = gasLimit.add((await tx.deploymentTransaction()).gasLimit);
        console.log("Token was deployed with address: ", await token.getAddress());

        console.log("Deployig claimer contract...");
        const Claimer = await ethers.getContractFactory("Claimer");
        const claimer = await Claimer.deploy(await token.getAddress());
        tx = await claimer.waitForDeployment();
        gasLimit = gasLimit.add((await tx.deploymentTransaction()).gasLimit);
        console.log("Claimer was deployed with address: ", await claimer.getAddress());

        console.log("Providing claimer contract with funds...");
        tx = await token.transfer(await claimer.getAddress(), ethers.utils.parseEther("100000"));
        gasLimit = gasLimit.add(tx.gasLimit);
        console.log("Funds has been sent to", await claimer.getAddress());
        console.log("Claimer balance: ", await token.balanceOf(await claimer.getAddress()));
        console.log("Deployer balance: ", await token.balanceOf(owner.address));

        console.log("Deployment was done\n");
        console.log("Total gas limit: %s", gasLimit.toString());
        console.log("Owner address: %s", owner.address);
        console.log("Translator address: %s", await translator.getAddress());
        console.log("Initializer address: %s", await initializer.getAddress());
        console.log("Multichain token address: %s", await token.getAddress());
        console.log("Claimer address: %s\n", await claimer.getAddress());
    })
