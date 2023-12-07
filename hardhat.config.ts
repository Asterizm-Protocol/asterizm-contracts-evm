import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import { HardhatUserConfig } from "hardhat/config";
const { ApiBaseUrl } = require("@fireblocks/fireblocks-web3-provider");

import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-upgradable";

require('dotenv').config();
require("@nomicfoundation/hardhat-chai-matchers");
require("@fireblocks/hardhat-fireblocks");

import './tasks/accounts_task';
import './tasks/deploy/deploy_base_task';
import './tasks/deploy/deploy_gas_task';
import './tasks/deploy/deploy_claim_task';
import './tasks/deploy/deploy_checker_task';
import './tasks/deploy/deploy_trustaddresses_task';
import './tasks/deploy/deploy_removetrustedaddress_task';
import './tasks/deploy/deploy_externalrelay_task';
import './tasks/deploy/deploy_singletrustedaddress_task';
import './tasks/gas/gas_withdrawcoins_task';
import './tasks/gas/gas_withdrawtokens_task';
import './tasks/gas/gas_removestable_task';
import './tasks/gas/gas_coinsbalance_task';
import './tasks/gas/gas_updatelimits_task';
import './tasks/deploy/upgrade_gas_task';
import './tasks/deploy/upgrade_translator_task';
import './tasks/deploy/upgrade_initializer_task';
import './tasks/demo/demo_deploy_task';
import './tasks/demo/demo_sendmessage_task';
import './tasks/relay/relay_addchain_task';
import './tasks/relay/relay_deploy_task';
import './tasks/relay/relay_updatefee_task';
import './tasks/relay/relay_updatesystemfee_task';
import './tasks/relay/relay_manageexternalrelay_task';
import './tasks/chainlink/chainlink_deploy_relay_task';
import './tasks/chainlink/chainlink_chainrelay_task';
import './tasks/test_task';

const config = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      }
    },
  },
  defaultNetwork: "localhost",
  gasReporter: {
    enabled: true,
  },
  zksolc: {
    version: "latest",
    settings: {},
  },
  networks: {
    // hardhat: {
    //   chainId: 1
    // },
    localhost: {
      url: process.env.NETWORK_HOST_LOCALHOST,
      accounts: [
        process.env.OWNER_1_PK_LOCALHOST,
        process.env.OWNER_2_PK_LOCALHOST,
        process.env.OWNER_3_PK_LOCALHOST,
        process.env.OWNER_4_PK_LOCALHOST,
        process.env.OWNER_5_PK_LOCALHOST,
      ],
      chainId: 31337
    },
    mainnet: {
      url: process.env.NETWORK_HOST_ETHEREUM,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 1
    },
    ethereumGoerli: {
      url: process.env.NETWORK_HOST_ETHEREUM_GOERLI,
      accounts: [process.env.OWNER_PK_ASTERIZM_TEST],
      chainId: 5
    },
    ethereumSepolia: {
      url: process.env.NETWORK_HOST_ETHEREUM_SEPOLIA,
      accounts: [process.env.OWNER_PK_ASTERIZM_TEST],
      chainId: 11155111
    },
    ethereumSepoliaFB: {
      url: process.env.NETWORK_HOST_ETHEREUM_SEPOLIA,
      chainId: 11155111,
      fireblocks: {
        apiBaseUrl: ApiBaseUrl.Sandbox,
        privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
        apiKey: process.env.FIREBLOCKS_API_KEY,
        vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
      }
    },
    polygon: {
      url: process.env.NETWORK_HOST_POLYGON,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 137
    },
    polygonMumbai: {
      url: process.env.NETWORK_HOST_POLYGON_MUMBAI,
      accounts: [process.env.OWNER_PK_ASTERIZM_TEST],
      chainId: 80001
    },
    bsc: {
      url: process.env.NETWORK_HOST_BSC,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 56
    },
    bscTestnet: {
      url: process.env.NETWORK_HOST_BSC_TESTNET,
      accounts: [process.env.OWNER_PK_ASTERIZM_TEST],
      chainId: 97
    },
    opBnbTestnet: {
      url: process.env.NETWORK_HOST_OPBNB_TESTNET,
      accounts: [process.env.OWNER_PK_ASTERIZM_TEST],
      chainId: 5611
    },
    avalanche: {
      url: process.env.NETWORK_HOST_AVALANCHE,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 43114
    },
    optimisticEthereum: {
      url: process.env.NETWORK_HOST_OPTIMISM,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 10
    },
    arbitrumOne: {
      url: process.env.NETWORK_HOST_ARBITRUM,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 42161
    },
    opera: {
      url: process.env.NETWORK_HOST_FANTOM,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 250
    },
    operaTestnet: {
      url: process.env.NETWORK_HOST_FANTOM_TESTNET,
      accounts: [process.env.OWNER_PK_ASTERIZM_TEST],
      chainId: 4002
    },
    moonbeam: {
      url: process.env.NETWORK_HOST_MOON,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 1284
    },
    celo: {
      url: process.env.NETWORK_HOST_CELO,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 42220
    },
    boba: {
      url: process.env.NETWORK_HOST_BOBA,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 288
    },
    aurora: {
      url: process.env.NETWORK_HOST_AURORA,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 1313161554
    },
    venidiumMainnet: {
      url: process.env.NETWORK_HOST_VENIDIUM,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 8192
    },
    venidiumTestnet: {
      url: process.env.NETWORK_HOST_VENIDIUM_TESTNET,
      accounts: [process.env.OWNER_PK_ASTERIZM_TEST],
      chainId: 8193
    },
    bitgertMainnet: {
      url: process.env.NETWORK_HOST_BITGERT,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 32520
    },
    polygonZkMainnet: {
      url: process.env.NETWORK_HOST_POLYGONZK,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 1101
    },
    polygonZkTestnet: {
      url: process.env.NETWORK_HOST_POLYGONZK_TESTNET,
      accounts: [process.env.OWNER_PK_ASTERIZM_TEST],
      chainId: 1442
    },
    fastexMainnet: {
      url: process.env.NETWORK_HOST_FASTEX,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 5165
    },
    baseMainnet: {
      url: process.env.NETWORK_HOST_BASE,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 8453
    },
    zksyncMainnet: {
      url: process.env.NETWORK_HOST_ZKSYNC,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 324
    },
    lineaMainnet: {
      url: process.env.NETWORK_HOST_LINEA,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 59144
    },
    mantleMainnet: {
      url: process.env.NETWORK_HOST_MANTLE,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 5000
    },
    gnosisMainnet: {
      url: process.env.NETWORK_HOST_GNOSIS,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 100
    },
    patexMainnet: {
      url: process.env.NETWORK_HOST_PATEX,
      accounts: [process.env.OWNER_PK_ASTERIZM],
      chainId: 789
    },
    asterizmPrivateChain: {
      url: process.env.NETWORK_HOST_ASTERIZM,
      accounts: [process.env.OWNER_PK_ASTERIZM_TEST],
      chainId: 1990991
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      avalanche: process.env.AVALANCHESCAN_API_KEY,
      optimisticEthereum: process.env.OPTIMISMSCAN_API_KEY,
      arbitrumOne: process.env.ARBIRTUMSCAN_API_KEY,
      opera: process.env.FANTOMSCAN_API_KEY,
      moonbeam: process.env.MOONSCAN_API_KEY
    },
    customChains: [
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL: "https://api.avascan.info/v2/network/mainnet/evm/43114/etherscan",
          browserURL: "https://avascan.info/blockchain/c"
        }
      },
    ],
  }
};

export default config;
