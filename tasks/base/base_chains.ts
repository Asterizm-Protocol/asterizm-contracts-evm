import { ChainTypes } from './base_chain_types';

export const Chains = {
    // MAINNET
    mainnet: [
        {
            id: 1,
            title: "ETH", // Ethereum
            networkName: "mainnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x0000000000000000000000000000000000000000',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x5Fd67fee0E0f197C3eEb160a1365de11321B0423',
            },
            stableCoins: [
                '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
            ],
        },
        {
            id: 137,
            title: "POL", // Polygon
            networkName: "polygon",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0xab52cD1975906c23d876995c74B84abB3Ab651f5',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x2aa10870a044C6Ef116ac6A4856DF69C9223f19D',
            },
            stableCoins: [
                '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7',
                '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            ],
        },
        {
            id: 250,
            title: "FTM", // Fantom
            networkName: "opera",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0xae7c11BaadE21d177111ecDdF069d705BF6CF3Ea',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x8d2094d3C096Dfd7966d686a1A97378F72702D51',
            },
            stableCoins: [
                '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
                '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
            ],
        },
        {
            id: 56,
            title: "BSC", // Bsc
            networkName: "bsc",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x812B2df5C33f40fe4CF349056c26D42152DBe61b',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0xfcb81E2bD7fdF5b40378E2237C34150426F0f306',
            },
            stableCoins: [
                '0x55d398326f99059fF775485246999027B3197955',
                '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
                '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            ],
        },
        {
            id: 10,
            title: "OPT", // Optimism
            networkName: "optimisticEthereum",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x144919282C59b8f3ea9143B1068ad15e672Dac92',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0xD8094a1591E9Fa348d719311d613742f40574a36',
            },
            stableCoins: [
                '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
                '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
                '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            ],
        },
        {
            id: 42161,
            title: "ARB", // Arbitrum
            networkName: "arbitrumOne",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x417a852E28599623415102fA2138B61eEb848124',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0xE760803388244b249a93A7355DCdad638c49B404',
            },
            stableCoins: [
                '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
                '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            ],
        },
        {
            id: 43114,
            title: "AVA", // Avalanche
            networkName: "avalanche",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0xb8451d68582d6f708ee9363799A32530E8108590',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0xf414d49d569f225945DDBb255c3bBF3f6A3cf35a',
            },
            stableCoins: [
                '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
                '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            ],
        },
        {
            id: 42220,
            title: "CEL", // Celo
            networkName: "celo",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x4C9BFC8BA437e3fB7B746859827e162BBfDb51Ea',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0xD73bAb953739C638b6F5C9a2f0c1c2D6815aE703',
            },
            stableCoins: [
                '0x617f3112bf5397D0467D315cC709EF968D9ba546',
                '0xef4229c8c3250C675F21BCefa42f58EfbfF6002a',
                '0x765DE816845861e75A25fCA122bb6898B8B1282a',
            ],
        },
        {
            id: 288,
            title: "BOB", // Boba
            networkName: "boba",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0xaAbbC38338266199ae346f57168B06ac95928f3f',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x11952da661D6D040EF3405F6B09cEe9A43A6328E',
            },
            stableCoins: [
                '0x5DE1677344D3Cb0D7D465c10b72A8f60699C062d',
            ],
        },
        {
            id: 1313161554,
            title: "AUR", // Aurora
            networkName: "aurora",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x7d078dF1db3885E25c1E9B44Dc36C20016F7fa13',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x11D72C6eE71Be0bA65D06BF896F2a899fdeAa743',
            },
            stableCoins: [
                '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802',
                '0x4988a896b1227218e4a686fde5eabdcabd91571f',
            ],
        },
        {
            id: 4919,
            title: "XVM", // Venidium
            networkName: "venidiumMainnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x0000000000000000000000000000000000000000',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x0000000000000000000000000000000000000000',
            },
            stableCoins: [],
        },
        {
            id: 32520,
            title: "BTG", // BitGert
            networkName: "bitgertMainnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x2da63B662823d39d8AC022281C8C66EBB03B0253',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x9cBc90920e615FbEba125206e620B9767A08e3Ae',
            },
            stableCoins: [],
        },
        {
            id: 1101,
            title: "PZK", // Polygon ZkEVM
            networkName: "polygonZkMainnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x2da63B662823d39d8AC022281C8C66EBB03B0253',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x0000000000000000000000000000000000000000',
            },
            stableCoins: [],
        },
    ],

    // TESTNET CHAINS
    testnet: [
        {
            id: 11155111,
            title: "ETH", // Ethereum Sepolia
            networkName: "ethereumSepolia",
            isCurrent: true,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '1091313221966408868913347237915118571507129432647',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '1445598615683928705817058617104577746672278202387', // 0xFd36e243BB81650c781cb79d8933682C458E6813
            },
            stableCoins: [
                '0xc8e37E456c517D682ca8F343e46BF4DEFFd24D13',
            ],
        },
        {
            id: 80001,
            title: "POL", // Polygont Mumbai
            networkName: "polygonMumbai",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '524483678252950907191462497318668706849509749841',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '1173975214697860638476110722877999173771209566865', // 0xCdA2de8A34F066A8A880B4029F19e510A4a96a91
            },
            stableCoins: [
                '0x7f4F94A70e5E7236c7a14D04fd749FF5b7023bE8',
            ],
        },
        {
            id: 97,
            title: "BSC", // BSC Testnet
            networkName: "bscTestnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '2936373607545158941181338455647368695276129477', // 0x0083AbeA780bf5a24A0a1F026Bf80d258fA04CC5
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x0000000000000000000000000000000000000000',
            },
            stableCoins: [
                '0xA514927Af6404bCc86c641FAfA65BB5b9b44F13A',
            ],
        },
        {
            id: 4918,
            title: "XVM", // Venidium Testnet
            networkName: "venidiumTestnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '314889688339176324098060599865391262698455262059',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x0000000000000000000000000000000000000000',
            },
            stableCoins: [],
        },
        {
            id: 4002,
            title: "FTM", // Fantom Testnet
            networkName: "operaTestnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '262254645447925333379275843488529411462343473272',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x0000000000000000000000000000000000000000',
            },
            stableCoins: [],
        },
        {
            id: 20001,
            title: "EVER", // Everscale Testnet
            networkName: "everscaleTestnet",
            chainType: ChainTypes.TVM,
            trustAddresses: {
                gas: '55781409753215990494429610500862081143106455110780343957069048257042337087200',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x0000000000000000000000000000000000000000',
            },
            stableCoins: [
                '0:8c6dcaa30727458527e99a479dae92a92a51c24e235e5b531659e201204d79ee',
            ],
        },
        {
            id: 30001,
            title: "VNM", // Venom Testnet
            networkName: "venomTestnet",
            chainType: ChainTypes.TVM,
            trustAddresses: {
                gas: '71616880973359577305763635684840577858376993674409891262985322004629213849328',
                multichain: '0x0000000000000000000000000000000000000000',
                checker: '0x0000000000000000000000000000000000000000',
            },
            stableCoins: [
                // '0:d5756401c0e2ad938bb980e72846f22f02b15d83c2c9190f93c0c2ff44771336',
                '0:4a2219d92ed7971c16093c04dc2f442925fcfb4f1c7f18fc4b6b18cf100b27aa',
            ],
        },
    ],
};
