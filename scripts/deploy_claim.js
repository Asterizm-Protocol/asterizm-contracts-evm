const hre = require("hardhat");

async function main() {

  const [owner] = await ethers.getSigners();

  const Initializer = await ethers.getContractFactory("AsterizmInitializer");
  const Transalor = await ethers.getContractFactory("AsterizmTranslator");
  const Nonce = await ethers.getContractFactory("AsterizmNonce");

  console.log("Deploying translator...");
  const translator = await Transalor.deploy();
  await translator.deployed();
  console.log("Translator was deployed with address: ", translator.address);
  //TODO: set chains

  console.log("Deploying initialzier...");
  const initializer = await Initializer.deploy(translator.address);
  await initializer.deployed();
  await initializer.setIsDecSendAvailable(true);
  await initializer.setIsEncSendAvailable(false);
  console.log("Initializer was deployed with address: ", initializer.address);

  console.log("Setting endpoint for translator contract...");
  await translator.setEndpoint(initializer.address);
  console.log("Initializer has been set: ", initializer.address);

  console.log("Deploying Nonce contracts...");
  // Translator Nonce deployment
  const outboundTranslatorNonce = await Nonce.deploy();
  await outboundTranslatorNonce.deployed();

  const inboundTranslatorNonce = await Nonce.deploy();
  await inboundTranslatorNonce.deployed();

  await translator.setInBoundNonce(inboundTranslatorNonce.address);
  console.log("Transalor inbound nonce has been set: ", inboundTranslatorNonce.address);
  await translator.setOutBoundNonce(outboundTranslatorNonce.address);
  console.log("Transalor outbound nonce has been set: ", outboundTranslatorNonce.address);

  await outboundTranslatorNonce.setManipulator(translator.address);
  await inboundTranslatorNonce.setManipulator(translator.address);

  // Initializer Nonce deployment
  const outboundInitializerNonce = await Nonce.deploy();
  await outboundInitializerNonce.deployed();

  const inboundInitializerNonce = await Nonce.deploy();
  await inboundInitializerNonce.deployed();

  await initializer.setInBoundNonce(inboundInitializerNonce.address);
  console.log("Initializer inbound nonce has been set: ", inboundInitializerNonce.address);
  await initializer.setOutBoundNonce(outboundInitializerNonce.address);
  console.log("Initializer outbound nonce has been set: ", outboundInitializerNonce.address);

  await outboundInitializerNonce.setManipulator(initializer.address);
  await inboundInitializerNonce.setManipulator(initializer.address);


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

  console.log("Deployment was done. Wrap up...");

  console.log("Owner address: %s", owner.address);
  console.log("Translator address: %s", translator.address);
  console.log("Initializer address: %s", initializer.address);
  console.log("Token address: %s", token.address);
  console.log("Claimer address: %s", claimer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
