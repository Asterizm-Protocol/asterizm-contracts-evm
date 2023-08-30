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
                    address: '0x3e23e7505506c49B37160F629900Ab5c26da46D2',
                    uint: '354758104146685733677026025917250033014409938642',
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
                    address: '0xFA53B166e7b4733Dc1A320bCe130C67a1611720f',
                    uint: '1429114108448837888109215145090743932303872979471',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x3769dD539BC4eCb2695980743c7e265274C98612',
                    uint: '316355350906837093029903837924231717046008251922',
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
                    address: '0x54c818fFa5a1FdDf759ce71ACA9293246c95AFDE',
                    uint: '484017551475938300001763552292386146004178939870',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xa280aE74569564e6BB912047240a73B0f7cF785B',
                    uint: '927726197384469918190575495794837179277442512987',
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
                    address: '0x4bb48ddC1674D0473175d3C92e2b23dF0A9EcB8c',
                    uint: '432200799671810124008763853237769237632833735564',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x8EA39F2BE56F91A6BAeE2Ea8bBFD866F26E0dEfA',
                    uint: '814325576714923141637910258986009969406087585530',
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
                    address: '0x182066422b6C3542c44Dd8df18CA1222De4efD50',
                    uint: '137738310315645036986215177030737825403283373392',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x6D9ada1daeed7DC22532778A5B599123454d4eF9',
                    uint: '625733309359412784851217644169446632021465845497',
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
                    address: '0x7d65a556822BA3D780956e2A9D610E2A2cd8a043',
                    uint: '715890624582520060431413771369224101128882921539',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xBD36FC809c59206dd477cf66d519C2F09994DF32',
                    uint: '1080225491986446432693574564646809867428732133170',
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
                    address: '0xa92076e4AFa5D37334e278784B8a1F07EFC75399',
                    uint: '965543421183177382179055020210840576819491984281',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x62C95d39AE6eC3D4079DfC32A2A541053b8E73Ef',
                    uint: '563971666396188292612342078249023440097022735343',
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
                    address: '0xb90170b51fB7e654d2421a6e574652E3B67Abf8f',
                    uint: '1056195411556902542312649984440424481259572084623',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x3C1fCE3F952f751bd17e0DE0dA8A75f47e970f64',
                    uint: '343248736117577263971531016986528665227503275876',
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
                    address: '0x6400B7Cb01c3126aac4A6b9A7bb45dDf6896C296',
                    uint: '570915087710372048917037492863855938049362281110',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xe95ff87e4bAab3C2d20A93601DE9A920364ddF52',
                    uint: '1332335067218882763060590005737625783047694442322',
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
                    address: '0x8d2094d3C096Dfd7966d686a1A97378F72702D51',
                    uint: '805694287206406833469357564965481106698128076113',
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
            id: 32520,
            title: "BTG", // BitGert
            networkName: "bitgertMainnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0x36D72b295BE459b0a3E4E8c39cb9a9e15aC750eB',
                    uint: '313083921744188938162610159183674150318089130219',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x7d4254fF150E652a484CCB033353481f2a540588',
                    uint: '715103099768093326297342114803282031253264795016',
                },
            },
            stableCoins: [],
        },
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
            isCurrent: true,
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0x556d3BB875af7e4f4d20C2f02858C6E6Aa8B127f',
                    uint: '487700199139922574113057653629334569881086661247',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xFd36e243BB81650c781cb79d8933682C458E6813',
                    uint: '1445598615683928705817058617104577746672278202387',
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
                    address: '0x307B027A35E5e03f2620b3618bE18d02976922b1',
                    uint: '276774764469626859704716071527456298868329226929',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xCdA2de8A34F066A8A880B4029F19e510A4a96a91',
                    uint: '1173975214697860638476110722877999173771209566865',
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
                    address: '0x000087e152cD5bab3c635857eb355A2A4E0E9199',
                    uint: '11836832196320620793238404379083707312411033',
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
            id: 5611,
            title: "opBNB", // opBNB Testnet
            networkName: "opBnbTestnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0xc8e37E456c517D682ca8F343e46BF4DEFFd24D13',
                    uint: '1146871423096324818780652019202769904412751187219',
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
                    address: '0x372824586FEE6388208D55021D6EEAE9F88D636B',
                    uint: '314889688339176324098060599865391262698455262059',
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
            id: 4002,
            title: "FTM", // Fantom Testnet
            networkName: "operaTestnet",
            chainType: ChainTypes.EVM,
            trustAddresses: {
                gas: {
                    address: '0xA514927Af6404bCc86c641FAfA65BB5b9b44F13A',
                    uint: '942442252325422866658814034522812761632263172410',
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
            title: "EVER", // Everscale Testnet
            networkName: "everscaleTestnet",
            chainType: ChainTypes.TVM,
            trustAddresses: {
                gas: {
                    address: '0:bbc77c9530eb2911428f0073348fbf4c7c9c77566b5fb91a17133ccb29bbc34e',
                    uint: '84934965089692497928389587548400175265641450849284970214327737498457626886990',
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
            title: "VNM", // Venom Testnet
            networkName: "venomTestnet",
            chainType: ChainTypes.TVM,
            trustAddresses: {
                gas: {
                    address: '0:da8924290da2c00ad817f4fc7b69c88281ceccd727c58ed5e6aac46119f7610d',
                    uint: '98846508608689020458447024475214917580102016240576075957701412290997566005517',
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
