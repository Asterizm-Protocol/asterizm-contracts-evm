const hre = require("hardhat");

async function deployBase() {
    const [owner] = await ethers.getSigners();
    const Initializer = await ethers.getContractFactory("AsterizmInitializer");
    const Transalor = await ethers.getContractFactory("AsterizmTranslator");

    //TODO: update chains list before deploy contracts
    const chains = [
        {
            id: 1,
            title: "ETH",
            isCurrent: true,
            stableCoins: [
                '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
            ],
        },
        {
            id: 137,
            title: "POL",
            isCurrent: false,
            stableCoins: [
                '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7',
                '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            ],
        },
        {
            id: 250,
            title: "FTM",
            isCurrent: false,
            stableCoins: [
                '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
                '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
            ],
        },
        {
            id: 10,
            title: "OPT",
            isCurrent: false,
            stableCoins: [
                '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
                '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
                '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            ],
        },
        {
            id: 56,
            title: "BSC",
            isCurrent: false,
            stableCoins: [
                '0x55d398326f99059fF775485246999027B3197955',
                '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
                '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            ],
        },
        {
            id: 43114,
            title: "AVA",
            isCurrent: false,
            stableCoins: [
                '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
                '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            ],
        },
        {
            id: 42161,
            title: "ARB",
            isCurrent: false,
            stableCoins: [
                '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
                '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            ],
        },
        {
            id: 288,
            title: "BOB",
            isCurrent: false,
            stableCoins: [
                '0x5DE1677344D3Cb0D7D465c10b72A8f60699C062d',
            ],
        },
        {
            id: 42220,
            title: "CEL",
            isCurrent: false,
            stableCoins: [
                '0x617f3112bf5397D0467D315cC709EF968D9ba546',
                '0xef4229c8c3250C675F21BCefa42f58EfbfF6002a',
                '0x765DE816845861e75A25fCA122bb6898B8B1282a',
            ],
        },
        {
            id: 1313161554,
            title: "AUR",
            isCurrent: false,
            stableCoins: [
                '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802',
                '0x4988a896b1227218e4a686fde5eabdcabd91571f',
            ],
        },
    ];
    // const chains = [
    //     {
    //         id: 5,
    //         title: "ETH",
    //         isCurrent: true,
    //         stableCoins: [
    //             '0xB528B84BBcc7c6737F984dfD8ed7C9A77C530a4D',
    //         ],
    //     },
    //     {
    //         id: 8001,
    //         title: "POL",
    //         isCurrent: false,
    //         stableCoins: [
    //             '0xEeE2BDEC78fE7D7b4f981aDA6CaA31a4d9b32BF6',
    //         ],
    //     },
    // ];

    let currentChain = null;
    for (let i = 0; i < chains.length; i++) {
        if (chains[i].isCurrent) {
            currentChain = chains[i];
        }
    }

    const translator = await Transalor.attach('0xBEeF2C3178cA1F450D953F40Ada3C89e0a7cBdEB'); // change translator address here
    const initializer = await Initializer.attach('0xA0fD7958590B95c53dF1127E1400c9F1D737823b'); // change initializer address here

    return {initializer, translator, owner, currentChain};
}

async function main() {

    let {initializer, translator, owner, currentChain} = await deployBase();

    const minUsdAmount = 100; // change minUsdAmount here
    const useEncryption = true; // change useEncryption here
    const useForceOrder = false; // change useForceOrder here
    console.log("Deployig gas station contract...");
    const GasStation = await ethers.getContractFactory("GasStation");
    const gasStation = await GasStation.deploy(initializer.address, useEncryption, useForceOrder);
    await gasStation.deployed();
    console.log("Gas station was deployed with address: %s", gasStation.address);
    await gasStation.setMinUsdAmount(minUsdAmount);
    for (let i = 0; i < currentChain.stableCoins.length; i++) {
        await gasStation.addStableCoin(currentChain.stableCoins[i]);
    }
    console.log("Added stable coins");

    console.log("Deployment was done. Wrap up...\n");
    console.log("Owner address: %s", owner.address);
    console.log("Translator address: %s", translator.address);
    console.log("Initializer address: %s", initializer.address);
    console.log("Gas station address: %s\n", gasStation.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
