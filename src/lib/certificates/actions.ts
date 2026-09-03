"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth/current-user";
import {
  insertCertificate,
  recordBlockchainTransaction,
  markCertificateRevoked,
  getCertificateById,
} from "../db/certificates";
import { mockContractService } from "../blockchain/contract-service";

export interface IssueCertificateState {
  error?: string;
  success?: {
    certificateId: string;
    certificateNumber: string;
    transactionHash: string;
    recordedAt: string;
  };
}

function verificationUrlFor(certificateId: string): string {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${base}/verify/${certificateId}`;
}

export async function issueCertificate(
  _prevState: IssueCertificateState,
  formData: FormData
): Promise<IssueCertificateState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "You must be signed in to issue a certificate." };
  }

  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const recipientEmail = String(formData.get("recipientEmail") ?? "").trim();
  const certificateTitle = String(formData.get("certificateTitle") ?? "").trim();
  const certificateNumber = String(formData.get("certificateNumber") ?? "").trim();
  const issueDate = String(formData.get("issueDate") ?? "").trim();
  const expirationDate = String(formData.get("expirationDate") ?? "").trim();

  if (!recipientName || !recipientEmail || !certificateTitle || !certificateNumber || !issueDate) {
    return { error: "Please fill in all required fields." };
  }

  let certificateId: string;
  try {
    const inserted = await insertCertificate(
      {
        organizationId: currentUser.organization.organizationId,
        issuedByUserId: currentUser.user.userId,
        recipientName,
        recipientEmail,
        certificateTitle,
        certificateNumber,
        issueDate,
        expirationDate: expirationDate || null,
      },
      verificationUrlFor
    );
    certificateId = inserted.certificateId;
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: `Certificate number "${certificateNumber}" has already been issued.` };
    }
    throw err;
  }

  const blockchainRecord = await mockContractService.issueCertificate({
    certificateId,
    recipientName,
    certificateTitle,
    issueDate,
    expirationDate: expirationDate || null,
    organization: currentUser.organization.organizationName,
  });

  await recordBlockchainTransaction(
    certificateId,
    blockchainRecord.transactionHash,
    blockchainRecord.blockchainCertId
  );

  revalidatePath("/certificates");
  revalidatePath("/dashboard");

  return {
    success: {
      certificateId,
      certificateNumber,
      transactionHash: blockchainRecord.transactionHash,
      recordedAt: blockchainRecord.recordedAt,
    },
  };
}

export interface RevokeResult {
  error?: string;
}

export async function revokeCertificate(certificateId: string): Promise<RevokeResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "You must be signed in to revoke a certificate." };
  }

  const certificate = await getCertificateById(certificateId);
  if (!certificate) {
    return { error: "Certificate not found." };
  }

  await markCertificateRevoked(certificateId);

  const blockchainRecord = await mockContractService.revokeCertificate(certificateId);
  await recordBlockchainTransaction(
    certificateId,
    blockchainRecord.transactionHash,
    blockchainRecord.blockchainCertId
  );

  revalidatePath("/certificates");
  revalidatePath("/dashboard");
  revalidatePath(`/certificates/${certificateId}`);
  revalidatePath(`/verify/${certificateId}`);

  return {};
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}
