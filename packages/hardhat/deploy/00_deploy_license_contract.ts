import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployLicenseContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const licensePrice = hre.ethers.parseEther("0.01");

  await deploy("LicenseContract", {
    from: deployer,
    args: [deployer, licensePrice],
    log: true,
    autoMine: true,
  });

  const licenseContract = await hre.ethers.getContract<Contract>("LicenseContract", deployer);
  console.log("License price:", hre.ethers.formatEther(await licenseContract.licensePrice()), "ETH");
  console.log("Total licenses sold:", await licenseContract.totalLicensesSold());
};

export default deployLicenseContract;

deployLicenseContract.tags = ["LicenseContract"];
