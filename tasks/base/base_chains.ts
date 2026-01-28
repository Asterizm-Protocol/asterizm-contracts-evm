import { ChainTypes } from './base_chain_types';

export const Chains = {
    // MAINNET
    mainnet: [
        {
            id: 1,
            title: "ETH", // Ethereum
            networkName: "ethereumMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xFB069371947CFD755FED38745b1383BBF6292FFd',
                    uint: '1433103332103289064079310216519917038573007220733',
                },
                initializer: {
                    address: '0x699bB625d7b4A205A5ebe06998D797Bc164d391a',
                    uint: '602916513755484471797170946931147866939591571738',
                },
            },
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
                    address: '0x4C9BFC8BA437e3fB7B746859827e162BBfDb51Ea',
                    uint: '437361913901971447688660164742358754819898561002',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                // '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
            ],
            chainlink: {
                chainSelector: '5009297550715157269',
                feeToken: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
                baseRouter: '0xE561d5E02207fb5eB32cca20a699E0d8919a1476',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 137,
            title: "POL", // Polygon
            networkName: "polygonMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x7fd194e54E1eab0e4F5F5809e2FD2026b15468fC',
                    uint: '729715654287939467228382633079311704592684968188',
                },
                initializer: {
                    address: '0xb26FC884362dD0e8891C68B9E974a7872C59E67e',
                    uint: '1018693207370155322391001154982574759896625571454',
                },
            },
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
                    address: '0xAC398e29d353f0680a9A6B4e16ffAaa7a00d227e',
                    uint: '983229939235098941171860054683297091967400092286',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7',
                // '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            ],
            chainlink: {
                chainSelector: '4051577828743386545',
                feeToken: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1',
                baseRouter: '0x3C3D92629A02a8D95D5CB9650fe49C3544f69B43',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 250,
            title: "FTM", // Fantom
            networkName: "fantomMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x68e369EDC0d374F86295690CBaA981Ee3709c061',
                    uint: '598806537018999279328152488019493124736576766049',
                },
                initializer: {
                    address: '0x44CeB2CdD0e9891f26Ce5b96D2A7A3017304C25F',
                    uint: '392820901949391477580798006932408792960364495455',
                },
            },
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
                    address: '0x59E8070De88cc1E4085293eFD08aAd4fBa2eF6E0',
                    uint: '513274566008164863673458270168230392643082712800',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                // '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
                // '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
            ],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0xE561d5E02207fb5eB32cca20a699E0d8919a1476',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 56,
            title: "BSC", // Bsc
            networkName: "bscMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x5fF1e825A40DCB84D30BFcE2d56e6EC4116db0a3',
                    uint: '547748825679959398451673919948462113276197449891',
                },
                initializer: {
                    address: '0xF10866C198AA05f56697a5b35d165878c22eC08D',
                    uint: '1376054133060720892291558133295570193392392388749',
                },
            },
            trustAddresses: {
                gas: {
                    address: '0xf3EC4C24Aee3099aA2C8168822B13E98d05335ec',
                    uint: '1392554366193406771829250910892083494211229529580',
                },
                multichain: {
                    address: '0x13CB819Be579379B40eA0873781B0A058BD4D59B', // Stellar test
                    uint: '113009166454629344063052544563796738533345252763',
                },
                checker: {
                    address: '0x398a579193f5cc814DC9FE87A2a470683DC059Ee',
                    uint: '328497605080848121519146905820503632519326882286',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0x55d398326f99059fF775485246999027B3197955',
                '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                // '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
                '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            ],
            chainlink: {
                chainSelector: '11344663589394136015',
                feeToken: '0x404460C6A5EdE2D891e8297795264fDe62ADBB75',
                baseRouter: '0x536d7E53D0aDeB1F20E7c81fea45d02eC9dBD698',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 10,
            title: "OPT", // Optimism
            networkName: "optimisticEthereum",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x03e3DE45279A26040bEaEa2FE84A59fC49564c25',
                    uint: '22208603932138414949329570145715098746164235301',
                },
                initializer: {
                    address: '0xc9c54677a96252da797642fBc851523556009Ce0',
                    uint: '1151906530318469220785391650682441339555725483232',
                },
            },
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
                    address: '0xDd03057d1c234eCF4d32A4d1f896657ca5E90d98',
                    uint: '1261754340721791363367587229269420822021374807448',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
                '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
                // '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            ],
            chainlink: {
                chainSelector: '3734403246176062136',
                feeToken: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6',
                baseRouter: '0x261c05167db67B2b619f9d312e0753f3721ad6E8',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 42161,
            title: "ARB", // Arbitrum
            networkName: "arbitrumOne",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x2dcD03d9f2a1576318dADCF6765eBf43436Dd616',
                    uint: '261476572953413880653982392800644391921748137494',
                },
                initializer: {
                    address: '0x2aa10870a044C6Ef116ac6A4856DF69C9223f19D',
                    uint: '243368767574510829940649975649119716612893831581',
                },
            },
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
                    address: '0x7ab494c6986bf5D001cDc0503089459Be7b3747A',
                    uint: '700523968373073701777778808306040484793228162170',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
                '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
                // '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            ],
            chainlink: {
                chainSelector: '4949039107694359620',
                feeToken: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
                baseRouter: '0xE92634289A1841A979C11C2f618B33D376e4Ba85',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 43114,
            title: "AVA", // Avalanche
            networkName: "avalancheMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x6FBAD7F84F88fAF9E11CCcA5bCff5cC4B94865Df',
                    uint: '637864727805595462379623990128736909710963795423',
                },
                initializer: {
                    address: '0x1478477028f87c9EfDaDbaFD3bEC137Fd7E1445c',
                    uint: '116862127978686052451930518855527426428017656924',
                },
            },
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
                    address: '0x58352Ef44fDFD0290575C7FB402B58F3c0e8BD26',
                    uint: '503577217628241506697052540985991439591500463398',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
                '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            ],
            chainlink: {
                chainSelector: '6433500567565415381',
                feeToken: '0x5947BB275c521040051D82396192181b413227A3',
                baseRouter: '0x27F39D0af3303703750D4001fCc1844c6491563c',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 42220,
            title: "CEL", // Celo
            networkName: "celo",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x41f895e58e4d9666D62be552F546597Bb6568F47',
                    uint: '376628042757204253554474909011802762890999926599',
                },
                initializer: {
                    address: '0xe27C3853936810E967824A2ECD43302D28DfE97C',
                    uint: '1293002113338191020022365870173769932901277755772',
                },
            },
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
                    address: '0x8851e1575A3269AD83Bd537CC80FeDb9BE7e533D',
                    uint: '778248735181916001811134858112216580824953148221',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0x617f3112bf5397D0467D315cC709EF968D9ba546',
                '0xef4229c8c3250C675F21BCefa42f58EfbfF6002a',
                '0x765DE816845861e75A25fCA122bb6898B8B1282a',
            ],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 288,
            title: "BOB", // Boba
            networkName: "boba",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xD79aca85cF4eAEFbcd91Cf6069b180e311E21A15',
                    uint: '1230884972702570973100164522279777163546166696469',
                },
                initializer: {
                    address: '0xb90170b51fB7e654d2421a6e574652E3B67Abf8f',
                    uint: '1056195411556902542312649984440424481259572084623',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0x5DE1677344D3Cb0D7D465c10b72A8f60699C062d',
            ],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 1313161554,
            title: "AUR", // Aurora
            networkName: "aurora",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x242b5361b9d206aA40d2C505635b01F76f9E64B1',
                    uint: '206489863367314663842790686297877775651931317425',
                },
                initializer: {
                    address: '0xf9B545b5ca77c8B1349510566494AB6E5945624b',
                    uint: '1425581209424033797465848868281516673685717869131',
                },
            },
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
                    address: '0x180Ca0EEf9Ce8c53A67b3d3f3fBb56208B6e4700',
                    uint: '137297406727157155150219371293073471982218921728',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802',
                '0x4988a896b1227218e4a686fde5eabdcabd91571f',
            ],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 8192,
            title: "XVM", // Venidium (Torus)
            networkName: "venidiumMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xac8D042B7C6cC92fCBdFd259324f602d541ded07',
                    uint: '985091180901367840761599141252388610288339774727',
                },
                initializer: {
                    address: '0xA55BDd1701D370cE9E2fb66EC0f934F3Dd981571',
                    uint: '944032104643112257033211217745989932066289489265',
                },
            },
            trustAddresses: {
                gas: {
                    address: '0xA67865d45d1ee4C9e71474f913f2E372764336Ba',
                    uint: '950377427985100543723071020287659345047449712314',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0xA252037CB23BB9CF53aBD06ADa08fC8265E2A188',
                    uint: '926685469748525504936754509004107247204681556360',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
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
            contractAddresses: {
                translator: {
                    address: '0xa6b5758d6E42a3f50c960E40E060f4E34B469597',
                    uint: '951739143101520252189065334214508079412972787095',
                },
                initializer: {
                    address: '0xd3ed349b3bbeD545064f80dDA916275Bdf21be87',
                    uint: '1209886911917932535352398253503116688823593057927',
                },
            },
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
                    address: '0xEc28269d5B9C936fC812688c0D1Cd4D7bE1142f3',
                    uint: '1348217215535337102418210529111040129153962689267',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 5165,
            title: "FSX", // Fastex (Bahamut)
            networkName: "fastexMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xac8D042B7C6cC92fCBdFd259324f602d541ded07',
                    uint: '985091180901367840761599141252388610288339774727',
                },
                initializer: {
                    address: '0xA55BDd1701D370cE9E2fb66EC0f934F3Dd981571',
                    uint: '944032104643112257033211217745989932066289489265',
                },
            },
            trustAddresses: {
                gas: {
                    address: '0xA67865d45d1ee4C9e71474f913f2E372764336Ba',
                    uint: '950377427985100543723071020287659345047449712314',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x2e7763513E51A4365e5Ef159D505705D974c17EE',
                    uint: '265276015898536769535909174652399582360478947310',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 8453,
            title: "BSX", // Base
            networkName: "baseMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xd473EDbdCaa43344BD1268304Aee55e2D7cbB2D2',
                    uint: '1212891339306974807716800428937268510047624475346',
                },
                initializer: {
                    address: '0xC1A6233450e4C7E1169A62183eE5eBc099Ca242D',
                    uint: '1105540209204173940495306640535191601640054072365',
                },
            },
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
                    address: '0x73c40DAFBE3F0088a8330a3aC82BADD2d874bF91',
                    uint: '660906076965665316198297056036513466477213695889',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '15971525489660198786',
                feeToken: '0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196',
                baseRouter: '0x673AA85efd75080031d44fcA061575d1dA427A28',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 324,
            title: "ZSC", // zkSync
            networkName: "zksyncMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                initializer: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 59144,
            title: "LNX", // Linea
            networkName: "lineaMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xac8D042B7C6cC92fCBdFd259324f602d541ded07',
                    uint: '985091180901367840761599141252388610288339774727',
                },
                initializer: {
                    address: '0xA55BDd1701D370cE9E2fb66EC0f934F3Dd981571',
                    uint: '944032104643112257033211217745989932066289489265',
                },
            },
            trustAddresses: {
                gas: {
                    address: '0xA67865d45d1ee4C9e71474f913f2E372764336Ba',
                    uint: '950377427985100543723071020287659345047449712314',
                },
                multichain: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                checker: {
                    address: '0x1199cb4f02257fdafDF86FaF881FFeA741637e6f',
                    uint: '100482567798584755528521049825039929363013009007',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 5000,
            title: "MTL", // Mantle
            networkName: "mantleMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xac8D042B7C6cC92fCBdFd259324f602d541ded07',
                    uint: '985091180901367840761599141252388610288339774727',
                },
                initializer: {
                    address: '0xA55BDd1701D370cE9E2fb66EC0f934F3Dd981571',
                    uint: '944032104643112257033211217745989932066289489265',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 100,
            title: "GNS", // Gnosis
            networkName: "gnosisMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xac8D042B7C6cC92fCBdFd259324f602d541ded07',
                    uint: '985091180901367840761599141252388610288339774727',
                },
                initializer: {
                    address: '0xA55BDd1701D370cE9E2fb66EC0f934F3Dd981571',
                    uint: '944032104643112257033211217745989932066289489265',
                },
            },
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
                    address: '0x3C11820C18cdBD8044B0EeD85349Ce9588ebCC60',
                    uint: '342929887631334660223436754676854769928041647200',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 789,
            title: "PTX", // Patex
            networkName: "patexMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                initializer: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 463,
            title: "AREA", // Areon
            networkName: "areonMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xac8D042B7C6cC92fCBdFd259324f602d541ded07',
                    uint: '985091180901367840761599141252388610288339774727',
                },
                initializer: {
                    address: '0xA55BDd1701D370cE9E2fb66EC0f934F3Dd981571',
                    uint: '944032104643112257033211217745989932066289489265',
                },
            },
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
                    address: '0xA23C4235d26e94B016A796525D3cd56654044099',
                    uint: '926200317310922830817339070044806267472496050329',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 1000,
            title: "VNM", // Venom
            networkName: "venom",
            chainType: ChainTypes.TVM,
            giverId: process.env.MAINNET_VENOM_GIVER_ID || '0',
            contractAddresses: {
                translator: {
                    address: '0:d19920b4e82f9719bdef9ec9f6ac9367c56c79a18f039e872b6a729581084e24',
                    uint: '94803938687939294512490590504432464859765011389351923733771084920776741637668',
                },
                initializer: {
                    address: '0:9ad0a923e48963230aa40188743e9b5d0b7ce8682c79065b76bdcb89c581ab46',
                    uint: '70024850234095389043942856028574521398675775440245331637751724674411042810694',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 2000,
            title: "EVER", // Everscale
            networkName: "main",
            chainType: ChainTypes.TVM,
            giverId: process.env.MAINNET_EVER_GIVER_ID || '0',
            contractAddresses: {
                translator: {
                    address: '0:cfc2b08eb78371e3faa4e0e9c84c7b0da4a4a8c32e8e5b87e6dab1881b597f15',
                    uint: '93972746542298833492479804489318718361231249092571931605279958937118703189781',
                },
                initializer: {
                    address: '0:62686a6a7b90eff9265e42eff7c0454b5060b668365e52b26276f20470d11e67',
                    uint: '44511145711777200210019510093255476547013536417057352300291724495480266235495',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 50,
            title: "XDC", // XDC
            networkName: "xdcMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xac8D042B7C6cC92fCBdFd259324f602d541ded07',
                    uint: '985091180901367840761599141252388610288339774727',
                },
                initializer: {
                    address: '0xA55BDd1701D370cE9E2fb66EC0f934F3Dd981571',
                    uint: '944032104643112257033211217745989932066289489265',
                },
            },
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
                    address: '0xA23C4235d26e94B016A796525D3cd56654044099',
                    uint: '926200317310922830817339070044806267472496050329',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 1006,
            title: "LMN", // Lemon
            networkName: "lemonMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xac8D042B7C6cC92fCBdFd259324f602d541ded07',
                    uint: '985091180901367840761599141252388610288339774727',
                },
                initializer: {
                    address: '0xA55BDd1701D370cE9E2fb66EC0f934F3Dd981571',
                    uint: '944032104643112257033211217745989932066289489265',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 4158,
            title: "XFI", // CrossFi
            networkName: "crossfiMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xc7510259D51C2B2484d117F40f5F687930EC3016',
                    uint: '1137895728547999387732034229896735238630897627158',
                },
                initializer: {
                    address: '0xaA66A0cD4Cab564fA284Ffe4481302a9Df5a5aDb',
                    uint: '972817114875848104150930745054640245633179081435',
                },
            },
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
                    address: '0x2da63B662823d39d8AC022281C8C66EBB03B0253',
                    uint: '260611682777055404113896273346659605959612760659',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 88811,
            title: "UNT", // UnitZero
            networkName: "unitMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xac8D042B7C6cC92fCBdFd259324f602d541ded07',
                    uint: '985091180901367840761599141252388610288339774727',
                },
                initializer: {
                    address: '0xA55BDd1701D370cE9E2fb66EC0f934F3Dd981571',
                    uint: '944032104643112257033211217745989932066289489265',
                },
            },
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
                    address: '0xA23C4235d26e94B016A796525D3cd56654044099',
                    uint: '926200317310922830817339070044806267472496050329',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 151,
            title: "RDB", // Redbelly
            networkName: "redbellyMainnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xac8D042B7C6cC92fCBdFd259324f602d541ded07',
                    uint: '985091180901367840761599141252388610288339774727',
                },
                initializer: {
                    address: '0xA55BDd1701D370cE9E2fb66EC0f934F3Dd981571',
                    uint: '944032104643112257033211217745989932066289489265',
                },
            },
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
                    address: '0xA23C4235d26e94B016A796525D3cd56654044099',
                    uint: '926200317310922830817339070044806267472496050329',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 90000,
            title: "CANTON", // Canton
            networkName: "cantonMainnet",
            chainType: ChainTypes.CTN,
            contractAddresses: {
                translator: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                initializer: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
    ],

    // TESTNET CHAINS
    testnet: [
        {
            id: 11155111,
            title: "ETH", // Ethereum Sepolia
            networkName: "ethereumSepolia",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x9e8d434293Dd2E1C89bb385F0E51fA67F7cfdae1',
                    uint: '905170806041498055648232111631308755981657168609',
                },
                initializer: {
                    address: '0xa84b4464989e76b193d33fD65807F80BBD004A8a',
                    uint: '960788963254840334253825059726431921324932745866',
                },
            },
            trustAddresses: {
                gas: {
                    address: '0x7Aeb6eA9F31c9d976A2486968879d8d784a4468E',
                    uint: '701747189344486605282819314024598581164781094542',
                },
                multichain: {
                    address: '0xf0cc2117701bc0c2cbb2ab13aaa5ef26048c45dc',
                    uint: '1374710019699169557405591716121712414713447204316',
                },
                checker: {
                    address: '0x131CCD21B56AAAd4205B9ab353181C59b33A2A5a',
                    uint: '109113115000290043170016387629041891766657755738',
                },
                demo: {
                    address: '0x1d01A1746056CDCd1D65260000237468762E23Be',
                    uint: '165597097777936052324499905607670083562245071806',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0xc8e37E456c517D682ca8F343e46BF4DEFFd24D13',
            ],
            chainlink: {
                chainSelector: '16015286601757825753',
                feeToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
                baseRouter: '0xd0daae2231e9cb96b94c8512223533293c3693bf',
                asterizmRouter: '0xEE0670D1911eb9Fc7bE8e8Bb19CcA1f7195F6321',
            },
        },
        {
            id: 80001,
            title: "POL", // Polygont Mumbai
            networkName: "polygonMumbai",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x6282d1C32557eC3430b72cFb6304fD25d8F8Db8A',
                    uint: '562398465289004498312139319307586635057510013834',
                },
                initializer: {
                    address: '0x3EeF3BD23e5a843916EE53A2016aad108Fb20649',
                    uint: '359292517060576020942014088655573524202663315017',
                },
            },
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
                    address: '0x9eB89ecD85473eC3B6DB3F226Ae7827D3Ea8E747',
                    uint: '906137712582915965930062706651069662864425412423',
                },
                demo: {
                    address: '0xe7A74ABb5c7537100fEB4870F958Fac3af7dC5eE',
                    uint: '1322507602573320699786003569561590698947261613550',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0x7f4F94A70e5E7236c7a14D04fd749FF5b7023bE8',
            ],
            chainlink: {
                chainSelector: '12532609583862916517',
                feeToken: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
                baseRouter: '0x70499c328e1e2a3c41108bd3730f6670a44595d1',
                asterizmRouter: '0x2e49c9D452a7065a28C08C5B01aAD4Fe5D66CbC1',
            },
        },
        {
            id: 97,
            title: "BSC", // BSC Testnet
            networkName: "bscTestnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xefE8514fa0bEE1e1A8AAC366978b0431425A6e3a',
                    uint: '1369629650304091807344080129618049073068707049018',
                },
                initializer: {
                    address: '0xE412121479211c3e9c50EC940F50596f293c08F0',
                    uint: '1302052884149211578999212296436203952550002297072',
                },
            },
            trustAddresses: {
                gas: {
                    address: '0xE6C80c2858f7EA5bB325d41D6e205ea3b13364FF',
                    uint: '1317529085406174387464612824796491405687419790591',
                },
                multichain: {
                    address: '0x74164d84A1960438D307744D3c0a75Ae8FB64499',
                    uint: '662740298588006875104904986691829813669369627801',
                },
                checker: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                staking: {
                    address: '0x4E820008F839002842725b67C34cc5560384bEc7',
                    uint: '448200380052271906331378955617309784883782270663',
                },
                cantonNft: {
                    address: '0xB67b8b9EE3e749E86e072aA5B35354a8dccB67c2',
                    uint: '1041791474624652222887786420211721128689732904898',
                },
            },
            stableCoins: [
                '0xA514927Af6404bCc86c641FAfA65BB5b9b44F13A',
            ],
            chainlink: {
                chainSelector: '13264668187771770619',
                feeToken: '0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06',
                baseRouter: '0x9527e2d01a3064ef6b50c1da1c0cc523803bcff2',
                asterizmRouter: '0xFb2458C4C033781a0003fDFF15Fb84907d5ba47e',
            },
        },
        {
            id: 4002,
            title: "FTM", // Fantom Testnet
            networkName: "fantomTestnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x20e0400404f874E586589D1631FA5603123F7Bc0',
                    uint: '187688648144869797247101501478622272540892953536',
                },
                initializer: {
                    address: '0x372824586fEe6388208D55021D6eeaE9f88d636B',
                    uint: '314889688339176324098060599865391262698455262059',
                },
            },
            trustAddresses: {
                gas: {
                    address: '0xaa7C1D2f415C4647C5E4fC47b83cA123D4F1b647',
                    uint: '973296265781112719212567326554452411688475014727',
                },
                multichain: {
                    address: '0x82c98447b0f823eda23D4d83A7817A78e58667F2',
                    uint: '746662773209027382731628800429796818339072731122',
                },
                checker: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 1442,
            title: "PZK", // Polygon zkEVM Testnet
            networkName: "polygonZkTestnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0xa3b0a6158Be7Ae64eF23296933AE5961F75AaB93',
                    uint: '934504894770587258788085374436794290303259028371',
                },
                initializer: {
                    address: '0xE6149A4963aA79E802E2d31c45B8282E4516bcaa',
                    uint: '1313527332458578713944991740637369053368083201194',
                },
            },
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
                    address: '0xc8e37E456c517D682ca8F343e46BF4DEFFd24D13',
                    uint: '1146871423096324818780652019202769904412751187219',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 5611,
            title: "opBNB", // opBNB Testnet
            networkName: "opBnbTestnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                initializer: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 5611,
            title: "azPC", // Asterizm Private Chain
            networkName: "asterizmPrivateChain",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x65778E36a83124E3cF0c707d21CB40e71BD325ea',
                    uint: '579274245075248533840642260503954834129056638442',
                },
                initializer: {
                    address: '0x8b314A606F9C347093B69BBe102855BD9DE4edbd',
                    uint: '794648932783863238517312334764403844450535927229',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        // {
        //     id: 4918,
        //     title: "XVM", // Venidium Testnet
        //     networkName: "venidiumTestnet",
        //     chainType: ChainTypes.EVM,
        //     contractAddresses: {
        //         translator: {
        //             address: '0x0000000000000000000000000000000000000000',
        //             uint: '0',
        //         },
        //         initializer: {
        //             address: '0x0000000000000000000000000000000000000000',
        //             uint: '0',
        //         },
        //     },
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
        {
            id: 20001,
            title: "EVER",
            networkName: "test",
            chainType: ChainTypes.TVM,
            contractAddresses: {
                translator: {
                    address: '0:433884fcaf57013b026e056bf4158217802eda63edbcafdf6a7af9d229adc052',
                    uint: '30404822133596216763316421379650136152957876842887568173746545986487744053330',
                },
                initializer: {
                    address: '0:c9799fd36cb2dc59617d56bca3f4856ba0331be793d4f8f5ba02a589339737ef',
                    uint: '91129774137739921575772133409221292090805317640577677671991266457219918936047',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                '0:8c6dcaa30727458527e99a479dae92a92a51c24e235e5b531659e201204d79ee',
            ],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 30001,
            title: "VNM",
            networkName: "venom_test",
            chainType: ChainTypes.TVM,
            contractAddresses: {
                translator: {
                    address: '0:1a3cc0373b9fdfb25481ff20e612e71d9bead18a04681417023eefbe0d3fa2be',
                    uint: '11867471511426473120192298010944685840126330516339703058636238409805261152958',
                },
                initializer: {
                    address: '0:67c151d9b5afeded8cd31daee6ce08a39f33d9ee55070b5bb29eefd7085ca3bd',
                    uint: '46929789798475080937251847701497727383413495687672552711395355579356920193981',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [
                // '0:d5756401c0e2ad938bb980e72846f22f02b15d83c2c9190f93c0c2ff44771336',
                '0:4a2219d92ed7971c16093c04dc2f442925fcfb4f1c7f18fc4b6b18cf100b27aa',
            ],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 51,
            title: "XDC", // XDC testnet
            networkName: "xdcTestnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x83d13986BD486673246C3e4d90B2f94015A57a52',
                    uint: '752543657974151170156389962503478499403417090642',
                },
                initializer: {
                    address: '0x368249858eCBf9B7af5e5B18731f5d1769071BBB',
                    uint: '311191003144533610836569876219409758032482474939',
                },
            },
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
                    address: '0xcc11A3F6e5804D9366d4bab1bA0957c778bD4074',
                    uint: '1165027513233566821464575078488279740472125898868',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 40001,
            title: "TON", // Ton testnet
            networkName: "tonTestnet",
            chainType: ChainTypes.TON,
            contractAddresses: {
                translator: {
                    address: 'EQDIwbxNE9vu8wiQ2IyDO49HmC9iG2HTYD91W1qlKDjSP9hr',
                    uint: '90804870806476004739881921205513112618921191123935732807134167735293267464767',
                },
                initializer: {
                    address: 'EQCvYJFYeJH27ANH-vtbJ8-lnHHrDEDdzB2b3v1wwle8CE48',
                    uint: '79325368958683455530642312087680413228497002260828543716100925530151293795336',
                },
            },
            trustAddresses: {
                gas: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                multichain: {
                    address: 'EQC3Z-KVt6_jiREi_Kjgw_Vja0OLb-r-eaF60SyzLMahuc1g',
                    uint: '82956800369460856566174632957770929749457176919168498373121963061566857716153',
                },
                checker: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 1005,
            title: "LMN", // Lemon
            networkName: "lemonTestnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x83d13986BD486673246C3e4d90B2f94015A57a52',
                    uint: '752543657974151170156389962503478499403417090642',
                },
                initializer: {
                    address: '0x368249858eCBf9B7af5e5B18731f5d1769071BBB',
                    uint: '311191003144533610836569876219409758032482474939',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 4157,
            title: "XFI", // CrossFi
            networkName: "crossfiTestnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                initializer: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 1523903251,
            title: "HST", // Haust
            networkName: "haustTestnet",
            chainType: ChainTypes.EVM,
            contractAddresses: {
                translator: {
                    address: '0x8b314A606F9C347093B69BBe102855BD9DE4edbd',
                    uint: '794648932783863238517312334764403844450535927229',
                },
                initializer: {
                    address: '0x44DE63c860E961dd6c6f96ec93e4C4f1d9F54653',
                    uint: '393170830151693192137490714634169047190030599763',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
        {
            id: 90001,
            title: "CANTON", // Canton
            networkName: "cantonTestnet",
            chainType: ChainTypes.CTN,
            contractAddresses: {
                translator: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                initializer: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
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
                staking: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
                cantonNft: {
                    address: '0x0000000000000000000000000000000000000000',
                    uint: '0',
                },
            },
            stableCoins: [],
            chainlink: {
                chainSelector: '0',
                feeToken: '0x0000000000000000000000000000000000000000',
                baseRouter: '0x0000000000000000000000000000000000000000',
                asterizmRouter: '0x0000000000000000000000000000000000000000',
            },
        },
    ],
};
