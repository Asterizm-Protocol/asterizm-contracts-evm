const hre = require("hardhat");

async function deployBase() {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializer");
    const Transalor = await ethers.getContractFactory("AsterizmTranslator");
    const translator = await Transalor.attach('0xBEeF2C3178cA1F450D953F40Ada3C89e0a7cBdEB'); // change translator address here
    const initializer = await Initializer.attach('0xA0fD7958590B95c53dF1127E1400c9F1D737823b'); // change initializer address here

    return {initializer, translator, owner};
}

async function main() {

    let {initializer, translator, owner} = await deployBase();

    console.log("Deployig multichain token...");
    const Token = await ethers.getContractFactory("MultichainToken");
    const token = await Token.deploy(initializer.address, ethers.utils.parseEther("1000000"));
    await token.deployed();
    console.log("Token was deployed with address: ", token.address);

    console.log("Deployig claimer contract...");
    const Claimer = await ethers.getContractFactory("Claimer");
    const claimer = await Claimer.deploy(token.address);
    await claimer.deployed();
    console.log("Claimer was deployed with address: ", claimer.address);

    console.log("Providing claimer contract with funds...");
    await token.transfer(claimer.address, ethers.utils.parseEther("100000"));
    console.log("Funds has been sent to", claimer.address);
    console.log("Claimer balance: ", await token.balanceOf(claimer.address));
    console.log("Deployer balance: ", await token.balanceOf(owner.address));

    console.log("Deployment was done. Wrap up...\n");
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
