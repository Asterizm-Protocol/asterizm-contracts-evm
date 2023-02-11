const hre = require("hardhat");

async function main() {

  const Initializer = await ethers.getContractFactory("AsterizmInitializer");
  const Transalor = await ethers.getContractFactory("AsterizmTranslator");

  const translator = await Transalor.deploy();
  await translator.deployed();
  //TODO: set chains

  const initializer = await Initializer.deploy(translator.address);
  await initializer.deployed();
  await initializer.setIsDecSendAvailable(true);
  await initializer.setIsEncSendAvailable(false);

  console.log("Translator address:", translator.address);
  console.log("Initializer address:", initializer.address);


  await translator.setEndpoint(initializer.address);

  const Token = await ethers.getContractFactory("MultichainToken");

  const token = await Token.deploy(initializer.address, ethers.utils.parseEther("1000000"));
  await token.deployed();
  console.log("Token address: %s", token.address);

  const Claimer = await ethers.getContractFactory("Claimer");
  const claimer = await Claimer.deploy(token.address);
  await claimer.deployed();
  console.log("Claimer address: %s", claimer.address);

  const Gas = await ethers.getContractFactory("GasSender");
  const gas_sender = await Gas.deploy(initializer.address);
  await gas_sender.deployed();
  console.log("Gas sender address: %s", gas_sender.address);
  await initializer.addClient(gas_sender.address, false);
  await initializer.addClient(claimer.address, false);
  await initializer.addClient(token.address, false);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
