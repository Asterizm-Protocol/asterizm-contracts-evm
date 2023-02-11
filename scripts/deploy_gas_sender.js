const hre = require("hardhat");

async function deployBase() {
  const [owner] = await ethers.getSigners();
  const Initializer = await ethers.getContractFactory("AsterizmInitializer");
  const Transalor = await ethers.getContractFactory("AsterizmTranslator");
  const Nonce = await ethers.getContractFactory("AsterizmNonce");

  let totalGas = 0;

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
  ];

  console.log("Deploying translator...");
  console.log("Owner balance before deploy: %s wei", ethers.provider.getBalance(owner.address));
  console.log("Gas price: %s", await ethers.provider.getGasPrice());
  const translator = await Transalor.deploy();
  let res = await translator.deployed();
  totalGas = res.deployTransaction.gasLimit;
  console.log("Translator was deployed with address: %s", translator.address);
  for (let i = 0; i < chains.length; i++) {
    res = await translator.addChain(chains[i].id, chains[i].title);
    totalGas = totalGas.add(res.gasLimit);
    console.log("Set chain %s for translator", chains[i].title);
    if (chains[i].isCurrent) {
      res = await translator.setLocalChainId(chains[i].id);
      totalGas = totalGas.add(res.gasLimit);
      console.log("Set current chain %s for translator", chains[i].title);
    }
  }

  console.log("Deploying initialzier...");
  const initializer = await Initializer.deploy(translator.address);
  res = await initializer.deployed();
  totalGas = totalGas.add(res.deployTransaction.gasLimit);
  // res = await initializer.setIsDecSendAvailable(true);
  // totalGas = totalGas.add(res.gasLimit);
  res = await initializer.setIsEncSendAvailable(true);
  totalGas = totalGas.add(res.gasLimit);
  console.log("Initializer was deployed with address: %s", initializer.address);

  console.log("Setting endpoint for translator contract...");
  res = await translator.setEndpoint(initializer.address);
  totalGas = totalGas.add(res.gasLimit);
  console.log("Initializer has been set: %s", initializer.address);

  console.log("Deploying Nonce contracts...");
  // Translator Nonce deployment
  const outboundTranslatorNonce = await Nonce.deploy();
  res = await outboundTranslatorNonce.deployed();
  totalGas = totalGas.add(res.deployTransaction.gasLimit);

  const inboundTranslatorNonce = await Nonce.deploy();
  res = await inboundTranslatorNonce.deployed();
  totalGas = totalGas.add(res.deployTransaction.gasLimit);

  res = await translator.setInBoundNonce(inboundTranslatorNonce.address);
  totalGas = totalGas.add(res.gasLimit);
  console.log("Transalor inbound nonce has been set: %s", inboundTranslatorNonce.address);
  res = await translator.setOutBoundNonce(outboundTranslatorNonce.address);
  totalGas = totalGas.add(res.gasLimit);
  console.log("Transalor outbound nonce has been set: %s", outboundTranslatorNonce.address);

  res = await outboundTranslatorNonce.setManipulator(translator.address);
  totalGas = totalGas.add(res.gasLimit);
  res = await inboundTranslatorNonce.setManipulator(translator.address);
  totalGas = totalGas.add(res.gasLimit);

  // Initializer Nonce deployment
  const outboundInitializerNonce = await Nonce.deploy();
  res = await outboundInitializerNonce.deployed();
  totalGas = totalGas.add(res.deployTransaction.gasLimit);

  const inboundInitializerNonce = await Nonce.deploy();
  res = await inboundInitializerNonce.deployed();
  totalGas = totalGas.add(res.deployTransaction.gasLimit);

  res = await initializer.setInBoundNonce(inboundInitializerNonce.address);
  totalGas = totalGas.add(res.gasLimit);
  console.log("Initializer inbound nonce has been set: %s", inboundInitializerNonce.address);
  res = await initializer.setOutBoundNonce(outboundInitializerNonce.address);
  totalGas = totalGas.add(res.gasLimit);
  console.log("Initializer outbound nonce has been set: %s", outboundInitializerNonce.address);

  res = await outboundInitializerNonce.setManipulator(initializer.address);
  totalGas = totalGas.add(res.gasLimit);
  res = await inboundInitializerNonce.setManipulator(initializer.address);
  totalGas = totalGas.add(res.gasLimit);

  return {initializer, translator, owner, totalGas};
}

async function main() {

  let {initializer, translator, owner, totalGas} = await deployBase();

  console.log("Deployig gas sender contract...");
  const GasSender = await ethers.getContractFactory("GasSender");
  const gasSender = await GasSender.deploy(initializer.address);
  let res = await gasSender.deployed();
  totalGas = totalGas.add(res.deployTransaction.gasLimit);
  console.log("Gas sender was deployed with address: %s", gasSender.address);
  res = await initializer.addClient(gasSender.address, false);
  totalGas = totalGas.add(res.gasLimit);

  console.log("Deployment was done. Wrap up...");

  console.log("Owner address: %s", owner.address);
  console.log("Translator address: %s", translator.address);
  console.log("Initializer address: %s", initializer.address);
  console.log("Gas sender address: %s", gasSender.address);

  console.log("Total gas limit: %s", totalGas);

  console.log("Owner balance after deploy: %s wei", await ethers.provider.getBalance(owner.address));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
