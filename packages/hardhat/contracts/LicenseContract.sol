//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

contract LicenseContract {
    address public immutable owner;
    uint256 public licensePrice;
    mapping(address => bool) public hasLicense;
    uint256 public totalLicensesSold;

    event LicensePurchased(address indexed buyer, uint256 price);
    event LicensePriceChanged(uint256 newPrice);

    constructor(address _owner, uint256 _licensePrice) {
        owner = _owner;
        licensePrice = _licensePrice;
    }

    modifier isOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    function purchaseLicense() public payable {
        require(!hasLicense[msg.sender], "License already purchased");
        require(msg.value >= licensePrice, "Insufficient payment");

        hasLicense[msg.sender] = true;
        totalLicensesSold += 1;

        if (msg.value > licensePrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{ value: msg.value - licensePrice }("");
            require(refundSuccess, "Refund failed");
        }

        emit LicensePurchased(msg.sender, licensePrice);
    }

    function checkLicense(address _address) public view returns (bool) {
        return hasLicense[_address];
    }

    function setLicensePrice(uint256 _newPrice) public isOwner {
        require(_newPrice > 0, "Price must be greater than zero");
        licensePrice = _newPrice;
        emit LicensePriceChanged(_newPrice);
    }

    function withdraw() public isOwner {
        (bool success, ) = owner.call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
    }

    receive() external payable {}
}

