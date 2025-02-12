const hre = require("hardhat");
const {BigNumber} = require("ethers");

async function deployBase() {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializer");
    const Transalor = await ethers.getContractFactory("AsterizmTranslatorV1");
    const translator = await Transalor.attach('0xbf2ad38fd09F37f50f723E35dd84EEa1C282c5C9'); // change translator address here
    const initializer = await Initializer.attach('0xFC4EE541377F3b6641c23CBE82F6f04388290421'); // change initializer address here

    let gasLimit = BigNumber.from(0);
    return {initializer, translator, owner, gasLimit};
}

async function main() {

    let {initializer, translator, owner, gasLimit} = await deployBase();

    let tx;
    console.log("Deployig multichain token...");
    const Token = await ethers.getContractFactory("OmniChainToken");
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

    console.log("Deployment was done. Wrap up...\n");
    console.log("Total gas limit: %s", gasLimit);
    console.log("Owner address: %s", owner.address);
    console.log("Translator address: %s", translator.address);
    console.log("Initializer address: %s", initializer.address);
    console.log("Multichain token address: %s", token.address);
    console.log("Claimer address: %s\n", claimer.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
