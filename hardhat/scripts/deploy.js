const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WST_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  const cryptoDevsTokenContract = await ethers.getContractFactory(
    "WanShiTongToken"
  );

  const deployCryptoDevsTokenContract = await cryptoDevsTokenContract.deploy(
    WST_NFT_CONTRACT_ADDRESS
  );

  console.log("WST Token Address:", deployCryptoDevsTokenContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
