import { Certificate } from "../types";
import { contractService } from "../blockchain/contract-service";

export interface BlockchainVerification {
  /** True if a record was found on-chain and it matches the PostgreSQL record. */
  matched: boolean;
  /** The revoked flag as recorded on-chain, or null if no on-chain record was found or the lookup failed. */
  onChainRevoked: boolean | null;
  /** Human-readable reason when matched is false — a mismatch, a missing on-chain record, or a lookup failure (e.g. RPC unreachable). */
  error: string | null;
}

/**
 * Cross-checks a certificate's PostgreSQL record against the smart
 * contract's on-chain record via ContractService.getCertificate(). This is
 * a read-only call — no wallet/signing involved — so it's safe to run from
 * the public verification page. If the blockchain is unreachable, this
 * degrades gracefully (returns a descriptive error) rather than breaking
 * the page; the certificate's PostgreSQL-derived status is still shown.
 */
export async function verifyCertificateOnChain(
  certificate: Certificate
): Promise<BlockchainVerification> {
  try {
    const onChain = await contractService.getCertificate(certificate.certificateId);
    if (!onChain) {
      return {
        matched: false,
        onChainRevoked: null,
        error: "No matching record was found on the blockchain for this certificate ID.",
      };
    }

    const matched =
      onChain.recipientName === certificate.recipientName &&
      onChain.certificateTitle === certificate.certificateTitle &&
      onChain.organization === certificate.organizationName;

    return {
      matched,
      onChainRevoked: onChain.revoked,
      error: matched ? null : "The on-chain record does not match the database record.",
    };
  } catch (err) {
    return {
      matched: false,
      onChainRevoked: null,
      error: `Blockchain lookup failed: ${err instanceof Error ? err.message : "unknown error"}.`,
    };
  }
}
