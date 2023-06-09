import { ChainTypes } from './base_chain_types';

export const Chains = {
    // MAINNET
    mainnet: [
        {
            id: 1,
            title: "ETH",
            isCurrent: true,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
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
            title: "POL",
            isCurrent: false,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
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
            title: "FTM",
            isCurrent: false,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
            stableCoins: [
                '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
                '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
            ],
        },
        {
            id: 10,
            title: "OPT",
            isCurrent: false,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
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
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
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
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
            stableCoins: [
                '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
                '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            ],
        },
        {
            id: 42161,
            title: "ARB",
            isCurrent: false,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
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
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
            stableCoins: [
                '0x5DE1677344D3Cb0D7D465c10b72A8f60699C062d',
            ],
        },
        {
            id: 42220,
            title: "CEL",
            isCurrent: false,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
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
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
            stableCoins: [
                '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802',
                '0x4988a896b1227218e4a686fde5eabdcabd91571f',
            ],
        },
        {
            id: 4919,
            title: "XVM",
            isCurrent: false,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '0x6F6f570F45833E249e27022648a26F4076F48f78',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
            stableCoins: [],
        },
    ],

    // TESTNET CHAINS
    testnet: [
        {
            id: 11155111,
            title: "ETH",
            isCurrent: false,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '333569839214760763722405741441915060092788669041',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
            stableCoins: [
                '0xc8e37E456c517D682ca8F343e46BF4DEFFd24D13',
            ],
        },
        {
            id: 80001,
            title: "POL",
            isCurrent: false,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '1001792318131473935443371117546766492423376699260',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
            stableCoins: [
                '0x7f4F94A70e5E7236c7a14D04fd749FF5b7023bE8',
            ],
        },
        {
            id: 4918,
            title: "XVM",
            isCurrent: true,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: '518808823239964238596455561139580412774093272174',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
            stableCoins: [],
        },
        {
            id: 20001,
            title: "EVER",
            isCurrent: false,
            chainType: ChainTypes.TVM,
            trustAddresses: {
                gas: '18078528476164495385373164159684078115717938054061056179112352932299406526371',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
            stableCoins: [
                '0:8c6dcaa30727458527e99a479dae92a92a51c24e235e5b531659e201204d79ee',
            ],
        },
        {
            id: 30001,
            title: "VNM",
            isCurrent: false,
            chainType: ChainTypes.TVM,
            trustAddresses: {
                gas: '77013202391518145321148673299202649966980262903713046623642324291955393066991',
                multichain: '0xD42912755319665397FF090fBB63B1a31aE87Cee',
            },
            stableCoins: [
                '0:d5756401c0e2ad938bb980e72846f22f02b15d83c2c9190f93c0c2ff44771336',
            ],
        },
    ],
};
