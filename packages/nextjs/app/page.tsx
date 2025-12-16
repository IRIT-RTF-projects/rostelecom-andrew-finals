"use client";

import { useState } from "react";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { Address as AddressType, formatEther } from "viem";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [checkAddress, setCheckAddress] = useState<AddressType | undefined>(undefined);

  const { data: licensePrice } = useScaffoldReadContract({
    contractName: "LicenseContract",
    functionName: "licensePrice",
  });

  const { data: hasLicense } = useScaffoldReadContract({
    contractName: "LicenseContract",
    functionName: "hasLicense",
    args: [connectedAddress] as readonly [string | undefined],
  });

  const { data: totalLicensesSold } = useScaffoldReadContract({
    contractName: "LicenseContract",
    functionName: "totalLicensesSold",
  });

  const { data: checkedLicense } = useScaffoldReadContract({
    contractName: "LicenseContract",
    functionName: "checkLicense",
    args: [checkAddress] as readonly [string | undefined],
  });

  const { writeContractAsync: writeLicenseContractAsync } = useScaffoldWriteContract({
    contractName: "LicenseContract",
  });

  const handlePurchaseLicense = async () => {
    if (!licensePrice) return;

    try {
      await writeLicenseContractAsync({
        functionName: "purchaseLicense",
        value: licensePrice,
      });
      notification.success("License purchased successfully!");
    } catch (error) {
      console.error("Error purchasing license:", error);
      notification.error("Failed to purchase license");
    }
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full max-w-4xl">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">License Purchase System</span>
            <span className="block text-4xl font-bold">One Wallet, One License</span>
          </h1>

          <div className="mt-8 space-y-6">
            <div className="bg-base-100 rounded-3xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">License Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">License Price:</span>
                  <span className="text-lg font-bold">
                    {licensePrice ? `${formatEther(licensePrice)} ETH` : "Loading..."}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Licenses Sold:</span>
                  <span className="text-lg font-bold">{totalLicensesSold?.toString() || "0"}</span>
                </div>
              </div>
            </div>

            {connectedAddress && (
              <div className="bg-base-100 rounded-3xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Your License Status</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Your Address:</span>
                    <Address
                      address={connectedAddress}
                      chain={targetNetwork}
                      blockExplorerAddressLink={
                        targetNetwork.id === hardhat.id ? `/blockexplorer/address/${connectedAddress}` : undefined
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">License Status:</span>
                    <span className={`text-lg font-bold ${hasLicense ? "text-success" : "text-error"}`}>
                      {hasLicense ? "✓ Active" : "✗ Not Purchased"}
                    </span>
                  </div>
                  {!hasLicense && (
                    <button
                      className="btn btn-primary w-full mt-4"
                      onClick={handlePurchaseLicense}
                      disabled={!licensePrice}
                    >
                      Purchase License
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-base-100 rounded-3xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Check License</h2>
              <div className="space-y-3">
                <AddressInput
                  placeholder="Enter address to check"
                  value={checkAddress ?? ""}
                  onChange={value => setCheckAddress(value as AddressType)}
                />
                {checkAddress && (
                  <div className="flex justify-between items-center mt-4">
                    <span className="font-medium">License Status:</span>
                    <span className={`text-lg font-bold ${checkedLicense ? "text-success" : "text-error"}`}>
                      {checkedLicense ? "✓ Active" : "✗ Not Purchased"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
