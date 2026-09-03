import { BlockchainRecord } from "../types";

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
 * `mockContractService` is a placeholder implementation used during the
 * frontend-first phase so pages can be built and demoed before a real chain
 * connection exists. Swapping it for a real implementation (ethers/web3
 * client talking to the deployed contract) should require no changes outside
 * this file.
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
 * In-memory placeholder. Not connected to any real chain or contract.
 * Used only so the Issue Certificate and Revoke flows have something to call
 * during the frontend-first development phase.
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
};
