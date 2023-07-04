import "@nomicfoundation/hardhat-toolbox";
import { task } from 'hardhat/config';
import { BigNumber } from "ethers";

async function deployBase(hre, contractAddress) {
    const TranslatorContract = await ethers.getContractFactory("AsterizmTranslator");

    let gasLimit = BigNumber.from(0);
    const translatorContract = await TranslatorContract.attach(contractAddress);

    return {translatorContract, gasLimit};
}

task("relay:addChain", "Add chain to relay (translator) contract")
    .addPositionalParam("contractAddress", "Translator address")
    .addPositionalParam("chainId", "Chain ID")
    .addPositionalParam("chainType", "Chain type (see ChainTypes)")
    .addPositionalParam("gasPrice", "Gas price (for some networks)", '0')
    .setAction(async (taskArgs, hre) => {
        let {translatorContract, gasLimit} = await deployBase(hre, taskArgs.contractAddress);

        const gasPrice = parseInt(taskArgs.gasPrice);
        console.log("Adding contract trusted address...");
        let tx = await translatorContract.addChain(taskArgs.chainId, taskArgs.chainType, gasPrice > 0 ? {gasPrice: gasPrice} : {});
        gasLimit = gasLimit.add(tx.gasLimit);

        console.log("\nChain added successfully\n");

        console.log("Total gas limit: %s", gasLimit);
        console.log("Transaction hash: %s\n", tx.hash);
    });
