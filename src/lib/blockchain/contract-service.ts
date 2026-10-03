import { ethers } from "ethers";
import { BlockchainRecord } from "../types";
import contractAbi from "./CertificateRegistry.abi.json";

/**
 * Contract Service abstraction.
 *
 * The web application never talks to the blockchain directly. It calls this
 * service, which is responsible for encoding calls to the smart contract
 * (issueCertificate / getCertificate / revokeCertificate) and returning plain
 * data back to the app.
 *
 *   Next.js Web App -> Contract Service -> Smart Contract -> Blockchain
 *
 * This file defines the interface the rest of the app is written against.
 * `realContractService` talks to an actual deployed CertificateRegistry
 * contract (see onchain/contracts/CertificateRegistry.sol) over JSON-RPC via
 * ethers.js. `mockContractService` is kept below as a reference/offline
 * fallback — it is no longer used by the live app.
 */

export interface OnChainCertificate {
  certificateId: string;
  recipientName: string;
  certificateTitle: string;
  issueDate: string;
  expirationDate: string | null;
  organization: string;
  revoked: boolean;
}

export interface IssueCertificateInput {
  certificateId: string;
  recipientName: string;
  certificateTitle: string;
  issueDate: string;
  expirationDate: string | null;
  organization: string;
}

export interface ContractService {
  issueCertificate(input: IssueCertificateInput): Promise<BlockchainRecord>;
  getCertificate(certificateId: string): Promise<OnChainCertificate | null>;
  revokeCertificate(certificateId: string): Promise<BlockchainRecord>;
  reactivateCertificate(certificateId: string): Promise<BlockchainRecord>;
}

function randomHash(): string {
  const bytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  );
  return `0x${bytes.join("")}`;
}

/**
 * In-memory placeholder. Not connected to any real chain or contract. Kept
 * only as a reference implementation of the ContractService interface — the
 * app now imports `contractService` (realContractService) instead of this.
 */
export const mockContractService: ContractService = {
  async issueCertificate(input) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      transactionHash: randomHash(),
      blockchainCertId: input.certificateId,
      recordedAt: new Date().toISOString(),
    };
  },

  async getCertificate() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return null;
  },

  async revokeCertificate(certificateId) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      transactionHash: randomHash(),
      blockchainCertId: certificateId,
      recordedAt: new Date().toISOString(),
    };
  },

  async reactivateCertificate(certificateId) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      transactionHash: randomHash(),
      blockchainCertId: certificateId,
      recordedAt: new Date().toISOString(),
    };
  },
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. The blockchain network is not configured — see .env.example.`
    );
  }
  return value;
}

let cachedProvider: ethers.JsonRpcProvider | null = null;
function getProvider(): ethers.JsonRpcProvider {
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(requiredEnv("BLOCKCHAIN_RPC_URL"));
  }
  return cachedProvider;
}

/** Read-only contract handle — no wallet/signing, safe for the public verify path. */
function getReadContract(): ethers.Contract {
  return new ethers.Contract(requiredEnv("BLOCKCHAIN_CONTRACT_ADDRESS"), contractAbi, getProvider());
}

/** Signing contract handle — only used for issue/revoke/reactivate, which are gated behind org auth in the Server Actions that call this service. */
function getWriteContract(): ethers.Contract {
  const wallet = new ethers.Wallet(requiredEnv("BLOCKCHAIN_PRIVATE_KEY"), getProvider());
  return new ethers.Contract(requiredEnv("BLOCKCHAIN_CONTRACT_ADDRESS"), contractAbi, wallet);
}

async function sendAndConfirm(
  populate: (contract: ethers.Contract) => Promise<ethers.ContractTransactionResponse>,
  blockchainCertId: string
): Promise<BlockchainRecord> {
  const contract = getWriteContract();
  const tx = await populate(contract);
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Blockchain transaction was not confirmed (reverted or dropped).");
  }
  const block = await getProvider().getBlock(receipt.blockNumber);
  return {
    transactionHash: receipt.hash,
    blockchainCertId,
    recordedAt: block ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString(),
  };
}

/**
 * Talks to a real deployed CertificateRegistry contract over JSON-RPC. Every
 * transaction hash returned here comes from an actual signed, mined
 * transaction on the configured network (local Hardhat node by default —
 * see BLOCKCHAIN_RPC_URL in .env.local). Swapping to a public testnet is an
 * env-var change only; no code here changes.
 */
export const realContractService: ContractService = {
  async issueCertificate(input) {
    return sendAndConfirm(
      (contract) =>
        contract.issueCertificate(
          input.certificateId,
          input.recipientName,
          input.certificateTitle,
          input.issueDate,
          input.expirationDate ?? "",
          input.organization
        ),
      input.certificateId
    );
  },

  async getCertificate(certificateId) {
    const contract = getReadContract();
    const record = await contract.getCertificate(certificateId);
    if (!record.exists) return null;
    return {
      certificateId,
      recipientName: record.recipientName,
      certificateTitle: record.certificateTitle,
      issueDate: record.issueDate,
      expirationDate: record.expirationDate ? record.expirationDate : null,
      organization: record.organization,
      revoked: record.revoked,
    };
  },

  async revokeCertificate(certificateId) {
    return sendAndConfirm((contract) => contract.revokeCertificate(certificateId), certificateId);
  },

  async reactivateCertificate(certificateId) {
    return sendAndConfirm(
      (contract) => contract.reactivateCertificate(certificateId),
      certificateId
    );
  },
};

/** What the rest of the app actually imports and calls. */
export const contractService: ContractService = realContractService;
