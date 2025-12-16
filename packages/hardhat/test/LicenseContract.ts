import { expect } from "chai";
import { ethers } from "hardhat";
import { LicenseContract } from "../typechain-types";

describe("LicenseContract", function () {
  let licenseContract: LicenseContract;
  let owner: any;
  let buyer1: any;
  let buyer2: any;
  let buyer3: any;
  const licensePrice = ethers.parseEther("0.01");

  before(async () => {
    [owner, buyer1, buyer2, buyer3] = await ethers.getSigners();
    const licenseContractFactory = await ethers.getContractFactory("LicenseContract");
    licenseContract = (await licenseContractFactory.deploy(owner.address, licensePrice)) as LicenseContract;
    await licenseContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await licenseContract.owner()).to.equal(owner.address);
    });

    it("Should set the correct license price", async function () {
      expect(await licenseContract.licensePrice()).to.equal(licensePrice);
    });

    it("Should initialize with zero licenses sold", async function () {
      expect(await licenseContract.totalLicensesSold()).to.equal(0);
    });
  });

  describe("License Purchase", function () {
    it("Should allow purchasing a license with exact price", async function () {
      await expect(licenseContract.connect(buyer1).purchaseLicense({ value: licensePrice }))
        .to.emit(licenseContract, "LicensePurchased")
        .withArgs(buyer1.address, licensePrice);

      expect(await licenseContract.hasLicense(buyer1.address)).to.be.true;
      expect(await licenseContract.totalLicensesSold()).to.equal(1);
    });

    it("Should refund excess payment", async function () {
      const excessAmount = ethers.parseEther("0.02");
      const initialBalance = await ethers.provider.getBalance(buyer2.address);

      const tx = await licenseContract.connect(buyer2).purchaseLicense({ value: excessAmount });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const finalBalance = await ethers.provider.getBalance(buyer2.address);
      const expectedBalance = initialBalance - licensePrice - gasUsed;

      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
      expect(await licenseContract.hasLicense(buyer2.address)).to.be.true;
      expect(await licenseContract.totalLicensesSold()).to.equal(2);
    });

    it("Should reject purchase with insufficient payment", async function () {
      const insufficientAmount = ethers.parseEther("0.005");
      await expect(licenseContract.connect(buyer3).purchaseLicense({ value: insufficientAmount })).to.be.revertedWith(
        "Insufficient payment",
      );
    });

    it("Should reject second purchase from same address", async function () {
      await expect(licenseContract.connect(buyer1).purchaseLicense({ value: licensePrice })).to.be.revertedWith(
        "License already purchased",
      );
    });
  });

  describe("Check License", function () {
    it("Should return true for address with license", async function () {
      expect(await licenseContract.checkLicense(buyer1.address)).to.be.true;
      expect(await licenseContract.checkLicense(buyer2.address)).to.be.true;
    });

    it("Should return false for address without license", async function () {
      const [randomAddress] = await ethers.getSigners();
      expect(await licenseContract.checkLicense(randomAddress.address)).to.be.false;
    });
  });

  describe("License Price Management", function () {
    it("Should allow owner to change license price", async function () {
      const newPrice = ethers.parseEther("0.02");
      await expect(licenseContract.connect(owner).setLicensePrice(newPrice))
        .to.emit(licenseContract, "LicensePriceChanged")
        .withArgs(newPrice);

      expect(await licenseContract.licensePrice()).to.equal(newPrice);
    });

    it("Should reject price change from non-owner", async function () {
      const newPrice = ethers.parseEther("0.03");
      await expect(licenseContract.connect(buyer1).setLicensePrice(newPrice)).to.be.revertedWith("Not the Owner");
    });

    it("Should reject zero price", async function () {
      await expect(licenseContract.connect(owner).setLicensePrice(0)).to.be.revertedWith(
        "Price must be greater than zero",
      );
    });
  });

  describe("Withdraw", function () {
    it("Should allow owner to withdraw funds", async function () {
      const contractBalance = await ethers.provider.getBalance(await licenseContract.getAddress());
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await licenseContract.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + contractBalance - gasUsed);
    });

    it("Should reject withdraw from non-owner", async function () {
      await expect(licenseContract.connect(buyer1).withdraw()).to.be.revertedWith("Not the Owner");
    });
  });
});
