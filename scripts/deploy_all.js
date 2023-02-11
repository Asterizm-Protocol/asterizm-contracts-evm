const hre = require("hardhat");

async function deployBase() {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializer");
    const Transalor = await ethers.getContractFactory("AsterizmTranslator");
    const Nonce = await ethers.getContractFactory("AsterizmNonce");

    //TODO: update chains list before deploy contracts
    const chains = [
        {
            id: 1,
            title: "ETH",
            isCurrent: true,
        },
        {
            id: 137,
            title: "POL",
            isCurrent: false,
        },
        {
            id: 250,
            title: "FTM",
            isCurrent: false,
        },
        {
            id: 10,
            title: "OPT",
            isCurrent: false,
        },
        {
            id: 56,
            title: "BSC",
            isCurrent: false,
        },
        {
            id: 43114,
            title: "AVA",
            isCurrent: false,
        },
        {
            id: 42161,
            title: "ARB",
            isCurrent: false,
        },
        {
            id: 288,
            title: "BOB",
            isCurrent: false,
        },
        {
            id: 42220,
            title: "CEL",
            isCurrent: false,
        },
        {
            id: 1313161554,
            title: "AUR",
            isCurrent: false,
        },
    ];
    // const chains = [
    //     {
    //         id: 5,
    //         title: "ETH",
    //         isCurrent: true,
    //     },
    //     {
    //         id: 8001,
    //         title: "POL",
    //         isCurrent: false,
    //     },
    // ];

    console.log("Deploying translator...");
    // const translator = await Transalor.attach('0x...');
    const translator = await Transalor.deploy();
    await translator.deployed();
    console.log("Translator was deployed with address: %s", translator.address);
    let chainIds = [];
    let chainTitles = [];
    let currentChainId = null;
    for (let i = 0; i < chains.length; i++) {
        chainIds.push(chains[i].id);
        chainTitles.push(chains[i].title);
        if (chains[i].isCurrent) {
            currentChainId = chains[i].id;
        }
    }
    await translator.addChains(chainIds, chainTitles);
    await translator.setLocalChainId(currentChainId);
    console.log("Chains is set");

    console.log("Deploying initialzier...");
    // const initializer = await Initializer.attach('0x...');
    const initializer = await Initializer.deploy(translator.address);
    await initializer.deployed();
    console.log("Initializer was deployed with address: %s", initializer.address);
    await initializer.setIsEncSendAvailable(true);
    // await initializer.setIsDecSendAvailable(true);

    console.log("Setting endpoint for translator contract...");
    await translator.setEndpoint(initializer.address);
    console.log("Initializer has been set: %s", initializer.address);

    console.log("Deploying Nonce contracts...");
    // Translator Nonce deployment
    const outboundTranslatorNonce = await Nonce.deploy();
    await outboundTranslatorNonce.deployed();
    console.log("Transalor inbound nonce has been deployed: %s", outboundTranslatorNonce.address);
    await translator.setOutBoundNonce(outboundTranslatorNonce.address);
    console.log("Transalor outbound nonce has been set: %s", outboundTranslatorNonce.address);
    await outboundTranslatorNonce.setManipulator(translator.address);

    const inboundTranslatorNonce = await Nonce.deploy();
    await inboundTranslatorNonce.deployed();
    console.log("Transalor outbound nonce has been deployed: %s", inboundTranslatorNonce.address);
    await translator.setInBoundNonce(inboundTranslatorNonce.address);
    console.log("Transalor inbound nonce has been set: %s", inboundTranslatorNonce.address);
    await inboundTranslatorNonce.setManipulator(translator.address);

    // Initializer Nonce deployment
    const outboundInitializerNonce = await Nonce.deploy();
    await outboundInitializerNonce.deployed();
    console.log("Initializer inbound nonce has been deployed: %s", outboundInitializerNonce.address);
    await initializer.setOutBoundNonce(outboundInitializerNonce.address);
    console.log("Initializer outbound nonce has been set: %s", outboundInitializerNonce.address);
    await outboundInitializerNonce.setManipulator(initializer.address);

    const inboundInitializerNonce = await Nonce.deploy();
    await inboundInitializerNonce.deployed();
    console.log("Initializer outbound nonce has been deployed: %s", inboundInitializerNonce.address);
    await initializer.setInBoundNonce(inboundInitializerNonce.address);
    console.log("Initializer inbound nonce has been set: %s", inboundInitializerNonce.address);
    await inboundInitializerNonce.setManipulator(initializer.address);

    return {initializer, translator, owner};
}

async function main() {

    let {initializer, translator, owner} = await deployBase();

    console.log("Deployig gas sender contract...");
    const GasSender = await ethers.getContractFactory("GasSender");
    const gasSender = await GasSender.deploy(initializer.address);
    await gasSender.deployed();
    console.log("Gas sender was deployed with address: %s", gasSender.address);
    await gasSender.setMinUsdAmount('100');
    await initializer.addClient(gasSender.address, false);

    console.log("Deployig multichain token...");
    const Token = await ethers.getContractFactory("MultichainToken");
    const token = await Token.deploy(initializer.address, ethers.utils.parseEther("1000000"));
    await token.deployed();
    await initializer.addClient(token.address, false);
    console.log("Token was deployed with address: :", token.address);

    console.log("Deployig claimer contract...");
    const Claimer = await ethers.getContractFactory("Claimer");
    const claimer = await Claimer.deploy(token.address);
    await claimer.deployed();
    await initializer.addClient(claimer.address, false);
    console.log("Claimer was deployed with address: :", claimer.address);

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
    console.log("Claimer address: %s", claimer.address);
    console.log("Gas sender address: %s\n", gasSender.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
