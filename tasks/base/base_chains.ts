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
                gas: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xd3ed349b3bbeD545064f80dDA916275Bdf21be87',
                    uint: '1209886911917932535352398253503116688823593057927',
                },
            },
            stableCoins: [
                '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                // '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
            ],
        },
        {
            id: 137,
            title: "POL", // Polygon
            networkName: "polygon",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0xC9ad96EF0037899CFC0505cf7A9c3eE3E54026Ab',
                    uint: '1151378322025601367770562122596893208736715253419',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xFF93e83a0B1725B3cA7C4d8Abed90E43f5396487',
                    uint: '1459091085905718225547953382814662180900133495943',
                },
            },
            stableCoins: [
                '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7',
                // '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            ],
        },
        {
            id: 250,
            title: "FTM", // Fantom
            networkName: "opera",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0x01561f34D1C2085bafAb6fED29507c91E1Ce2573',
                    uint: '7629573312260563803861284685283058011675174259',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x83A133d715835F0c3836FafdbAE133bc6D081949',
                    uint: '751472726870773722371676941724394417188403419465',
                },
            },
            stableCoins: [
                // '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
                // '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
            ],
        },
        {
            id: 56,
            title: "BSC", // Bsc
            networkName: "bsc",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0xf3EC4C24Aee3099aA2C8168822B13E98d05335ec',
                    uint: '1392554366193406771829250910892083494211229529580',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x46C0e212C78decdAEf598aaf4F0C3e233b3fe650',
                    uint: '403930790802743117744862134669261699953618576976',
                },
            },
            stableCoins: [
                '0x55d398326f99059fF775485246999027B3197955',
                '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                // '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
                '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            ],
        },
        {
            id: 10,
            title: "OPT", // Optimism
            networkName: "optimisticEthereum",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0x2f526ea87dAc16EB82e07dFa09FaF7973D12d869',
                    uint: '270160867020937144486273072853277439961217554537',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x27046396bB1d9531f0812A3fb556A3c414aae955',
                    uint: '222748518450305384199166528213995787368285268309',
                },
            },
            stableCoins: [
                '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
                '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
                // '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            ],
        },
        {
            id: 42161,
            title: "ARB", // Arbitrum
            networkName: "arbitrumOne",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0x78Ac64e3a9bAD5975f19a7a649380532039C6926',
                    uint: '688923409371308107815485746155160942215207610662',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x1123a041fBD50710cE099A915778f1F47a52673D',
                    uint: '97847329604799104703545931460126109337520334653',
                },
            },
            stableCoins: [
                '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
                // '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            ],
        },
        {
            id: 43114,
            title: "AVA", // Avalanche
            networkName: "avalanche",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0x4f21a1AfFfE94C3DB0BbA0FA0B0d09082788b18D',
                    uint: '451760280454248547985966401960353534519756239245',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x3487e27b663BFB273B7B90BF0E087342792572b1',
                    uint: '299897850051885693553236772100908794596724929201',
                },
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
                gas: {
                    address: '0x7d65a556822BA3D780956e2A9D610E2A2cd8a043',
                    uint: '715890624582520060431413771369224101128882921539',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x1C4d33D17248a74ea681284641B03AdeC9797188',
                    uint: '161573412960860801196170176843110610065440731528',
                },
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
                gas: {
                    address: '0x8A78bd7BF2cC2Cbc6f666C35d37f75aa201E312A',
                    uint: '790533322197019073977689876207325072219099246890',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xdE4f4940fa08D195776eAB78b7B833DaE1121cEd',
                    uint: '1269164091300873583232669260247228297700411841773',
                },
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
                gas: {
                    address: '0xD8094a1591E9Fa348d719311d613742f40574a36',
                    uint: '1233349166853777707763483951555418287407652882998',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xa602619820CF6946B91297214dC8E06d3fCBEF51',
                    uint: '947745571105421811566647101951516272540892524369',
                },
            },
            stableCoins: [
                '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802',
                '0x4988a896b1227218e4a686fde5eabdcabd91571f',
            ],
        },
        // {
        //     id: 4919,
        //     title: "XVM", // Venidium
        //     networkName: "venidiumMainnet",
        //     chainType: ChainTypes.EVM,
        //     trustAddresses: {
        //         gas: {
        //             address: '0x0000000000000000000000000000000000000000',
        //             uint: '0',
        //         },
        //         multichain: {
        //             address: '0x0000000000000000000000000000000000000000',
        //             uint: '0',
        //         },
        //         checker: {
        //             address: '0x0000000000000000000000000000000000000000',
        //             uint: '0',
        //         },
        //     },
        //     stableCoins: [],
        // },
        // {
        //     id: 32520,
        //     title: "BTG", // BitGert
        //     networkName: "bitgertMainnet",
        //     chainType: ChainTypes.EVM,
        //     trustAddresses: {
        //         gas: {
        //             address: '0x36D72b295BE459b0a3E4E8c39cb9a9e15aC750eB',
        //             uint: '313083921744188938162610159183674150318089130219',
        //         },
        //         multichain: {
        //             address: '0x0000000000000000000000000000000000000000',
        //             uint: '0',
        //         },
        //         checker: {
        //             address: '0x7d4254fF150E652a484CCB033353481f2a540588',
        //             uint: '715103099768093326297342114803282031253264795016',
        //         },
        //     },
        //     stableCoins: [],
        // },
        {
            id: 1101,
            title: "PZK", // Polygon ZkEVM
            networkName: "polygonZkMainnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
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
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0x7Aeb6eA9F31c9d976A2486968879d8d784a4468E',
                    uint: '701747189344486605282819314024598581164781094542',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x013c5686B0B06E993c7d8c08AC38AA58E9A79720',
                    uint: '7054572972023190410624467989617135057327593248',
                },
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
                gas: {
                    address: '0x897A0Dc3555a76434Ee96df813f583c346b4bc87',
                    uint: '784853625445319498325442983188752893857718647943',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xf0717939b69746BA3De234a1cAc7a4e96A73871d',
                    uint: '1372688329430553070297040708232944173776949708573',
                },
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
                gas: {
                    address: '0xE6C80c2858f7EA5bB325d41D6e205ea3b13364FF',
                    uint: '1317529085406174387464612824796491405687419790591',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0xA514927Af6404bCc86c641FAfA65BB5b9b44F13A',
            ],
        },
        {
            id: 4002,
            title: "FTM", // Fantom Testnet
            networkName: "operaTestnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0xaa7C1D2f415C4647C5E4fC47b83cA123D4F1b647',
                    uint: '973296265781112719212567326554452411688475014727',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
        },
        {
            id: 5611,
            title: "opBNB", // opBNB Testnet
            networkName: "opBnbTestnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
        },
        {
            id: 4918,
            title: "XVM", // Venidium Testnet
            networkName: "venidiumTestnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
        },
        {
            id: 20001,
            title: "EVER",
            networkName: "test",
            chainType: ChainTypes.TVM,
            trustAddresses: {
                gas: {
                    address: '0:11a7ea3c198a07b9488e3f01709d35dcf7f4bdb99ce5495e72b1d1069e2646dc',
                    uint: '7985998514665057416902270288325604164455011125956049936801137760304875587292',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0:8c6dcaa30727458527e99a479dae92a92a51c24e235e5b531659e201204d79ee',
            ],
        },
        {
            id: 30001,
            title: "VNM",
            networkName: "venom_test",
            chainType: ChainTypes.TVM,
            trustAddresses: {
                gas: {
                    address: '0:f5718ca386cfd431dff84a01ec0801751d0a9e69252b69cbe8ba3a4cd001f8ec',
                    uint: '111017272274377422933554988091001217074200739456122614845216680075433991076076',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                // '0:d5756401c0e2ad938bb980e72846f22f02b15d83c2c9190f93c0c2ff44771336',
                '0:4a2219d92ed7971c16093c04dc2f442925fcfb4f1c7f18fc4b6b18cf100b27aa',
            ],
        },
    ],
};
