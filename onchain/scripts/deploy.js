const hre = require("hardhat");

async function main() {
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const contract = await CertificateRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CertificateRegistry deployed to:", address);
  console.log("Set this in the app's .env.local as BLOCKCHAIN_CONTRACT_ADDRESS.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
