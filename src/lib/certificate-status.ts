import { Certificate, CertificateStatus } from "./types";

/**
 * Status is derived, never stored directly:
 * revoked_at set -> REVOKED; else past expiration_date -> EXPIRED; else VALID.
 */
export function getCertificateStatus(
  certificate: Pick<Certificate, "revokedAt" | "expirationDate">,
  now: Date = new Date()
): CertificateStatus {
  if (certificate.revokedAt) return "revoked";
  if (certificate.expirationDate && now > new Date(certificate.expirationDate)) {
    return "expired";
  }
  return "valid";
}

export const STATUS_LABEL: Record<CertificateStatus, string> = {
  valid: "Valid",
  expired: "Expired",
  revoked: "Revoked",
};
