export type CertificateStatus = "valid" | "expired" | "revoked";

export interface BlockchainRecord {
  transactionHash: string;
  blockchainCertId: string;
  recordedAt: string;
}

export interface Certificate {
  certificateId: string;
  certificateNumber: string;
  recipientName: string;
  recipientEmail: string;
  certificateTitle: string;
  organizationName: string;
  issuedBy: string;
  issueDate: string;
  expirationDate: string | null;
  revokedAt: string | null;
  createdAt: string;
  verificationUrl: string;
  blockchain: BlockchainRecord;
}

export interface DashboardStats {
  total: number;
  valid: number;
  expired: number;
  revoked: number;
}

export interface ActivityEvent {
  type: "issued" | "revoked";
  certificateId: string;
  recipientName: string;
  certificateTitle: string;
  occurredAt: string;
}
