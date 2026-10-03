const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  async function deployFixture() {
    const [issuer, other] = await ethers.getSigners();
    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    const contract = await CertificateRegistry.deploy();
    await contract.waitForDeployment();
    return { contract, issuer, other };
  }

  const sample = {
    certificateId: "cert-1234",
    recipientName: "Alex Rivera",
    certificateTitle: "Introduction to Blockchain",
    issueDate: "2026-09-07",
    expirationDate: "",
    organization: "Metro Technical Institute",
  };

  it("issues a certificate and retrieves it", async function () {
    const { contract, issuer } = await deployFixture();

    await contract.issueCertificate(
      sample.certificateId,
      sample.recipientName,
      sample.certificateTitle,
      sample.issueDate,
      sample.expirationDate,
      sample.organization
    );

    const record = await contract.getCertificate(sample.certificateId);
    expect(record.exists).to.equal(true);
    expect(record.recipientName).to.equal(sample.recipientName);
    expect(record.certificateTitle).to.equal(sample.certificateTitle);
    expect(record.revoked).to.equal(false);
    expect(record.issuer).to.equal(issuer.address);
  });

  it("returns exists = false for an unknown certificate ID", async function () {
    const { contract } = await deployFixture();
    const record = await contract.getCertificate("does-not-exist");
    expect(record.exists).to.equal(false);
  });

  it("rejects issuing a duplicate certificate ID", async function () {
    const { contract } = await deployFixture();
    await contract.issueCertificate(
      sample.certificateId,
      sample.recipientName,
      sample.certificateTitle,
      sample.issueDate,
      sample.expirationDate,
      sample.organization
    );

    await expect(
      contract.issueCertificate(
        sample.certificateId,
        sample.recipientName,
        sample.certificateTitle,
        sample.issueDate,
        sample.expirationDate,
        sample.organization
      )
    ).to.be.revertedWith("Certificate already exists");
  });

  it("lets the issuer revoke their own certificate", async function () {
    const { contract } = await deployFixture();
    await contract.issueCertificate(
      sample.certificateId,
      sample.recipientName,
      sample.certificateTitle,
      sample.issueDate,
      sample.expirationDate,
      sample.organization
    );

    await contract.revokeCertificate(sample.certificateId);
    const record = await contract.getCertificate(sample.certificateId);
    expect(record.revoked).to.equal(true);
  });

  it("prevents a different account from revoking someone else's certificate", async function () {
    const { contract, other } = await deployFixture();
    await contract.issueCertificate(
      sample.certificateId,
      sample.recipientName,
      sample.certificateTitle,
      sample.issueDate,
      sample.expirationDate,
      sample.organization
    );

    await expect(
      contract.connect(other).revokeCertificate(sample.certificateId)
    ).to.be.revertedWith("Not authorized to revoke this certificate");
  });

  it("lets the issuer reactivate a revoked certificate", async function () {
    const { contract } = await deployFixture();
    await contract.issueCertificate(
      sample.certificateId,
      sample.recipientName,
      sample.certificateTitle,
      sample.issueDate,
      sample.expirationDate,
      sample.organization
    );
    await contract.revokeCertificate(sample.certificateId);

    await contract.reactivateCertificate(sample.certificateId);
    const record = await contract.getCertificate(sample.certificateId);
    expect(record.revoked).to.equal(false);
  });
});
