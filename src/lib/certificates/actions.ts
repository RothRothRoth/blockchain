"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth/current-user";
import {
  insertCertificate,
  recordBlockchainTransaction,
  markCertificateRevoked,
  markCertificateReactivated,
  deleteCertificateRecord,
  getCertificateById,
  certificateBelongsToOrganization,
} from "../db/certificates";
import { contractService } from "../blockchain/contract-service";
import { getCertificateStatus } from "../certificate-status";
import { isValidEmail, EmailResult } from "../email/certificate-email";
import { emailCertificateToRecipient } from "./delivery";

export interface EmailDeliveryOutcome {
  sent: boolean;
  recipient: string;
  message: string;
}

export interface IssueCertificateState {
  error?: string;
  success?: {
    certificateId: string;
    certificateNumber: string;
    transactionHash: string;
    recordedAt: string;
    email: EmailDeliveryOutcome;
  };
}

const EMAIL_FAILED_FALLBACK = "The email could not be sent.";

function toEmailOutcome(result: EmailResult, recipient: string): EmailDeliveryOutcome {
  return result.ok
    ? { sent: true, recipient, message: `Certificate emailed successfully to ${recipient}.` }
    : { sent: false, recipient, message: result.message };
}

/**
 * Post-issuance delivery. The certificate is already committed to PostgreSQL
 * and the blockchain by the time this runs, so it must never throw or roll
 * anything back — every failure is reported as a "not sent" outcome.
 */
async function emailIssuedCertificate(
  certificateId: string,
  organizationId: string,
  recipient: string
): Promise<EmailDeliveryOutcome> {
  try {
    const certificate = await getCertificateById(certificateId);
    if (!certificate) {
      return { sent: false, recipient, message: EMAIL_FAILED_FALLBACK };
    }
    return toEmailOutcome(await emailCertificateToRecipient(certificate, organizationId), recipient);
  } catch (err) {
    console.error(
      `[email] Unexpected error emailing certificate ${certificateId}:`,
      err instanceof Error ? err.message : err
    );
    return { sent: false, recipient, message: EMAIL_FAILED_FALLBACK };
  }
}

function verificationUrlFor(certificateId: string): string {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${base}/verify/${certificateId}`;
}

function blockchainErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown blockchain error.";
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
  if (!isValidEmail(recipientEmail)) {
    return { error: "Enter a valid recipient email address." };
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

  // The certificate record only exists in PostgreSQL at this point — it is
  // not "issued" from the platform's point of view until the blockchain
  // transaction actually confirms. If that fails, undo the DB insert rather
  // than leaving a certificate with no real blockchain record behind it.
  let blockchainRecord;
  try {
    blockchainRecord = await contractService.issueCertificate({
      certificateId,
      recipientName,
      certificateTitle,
      issueDate,
      expirationDate: expirationDate || null,
      organization: currentUser.organization.organizationName,
    });
  } catch (err) {
    await deleteCertificateRecord(certificateId);
    return {
      error: `Certificate was not issued: the blockchain transaction failed (${blockchainErrorMessage(
        err
      )}). Nothing was saved — please try again.`,
    };
  }

  await recordBlockchainTransaction(
    certificateId,
    blockchainRecord.transactionHash,
    blockchainRecord.blockchainCertId
  );

  revalidatePath("/certificates");
  revalidatePath("/dashboard");

  const email = await emailIssuedCertificate(
    certificateId,
    currentUser.organization.organizationId,
    recipientEmail
  );

  return {
    success: {
      certificateId,
      certificateNumber,
      transactionHash: blockchainRecord.transactionHash,
      recordedAt: blockchainRecord.recordedAt,
      email,
    },
  };
}

export interface ResendEmailResult {
  ok: boolean;
  message: string;
}

export async function resendCertificateEmail(certificateId: string): Promise<ResendEmailResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { ok: false, message: "You must be signed in to send a certificate." };
  }
  if (typeof certificateId !== "string" || certificateId.length === 0 || certificateId.length > 64) {
    return { ok: false, message: "Certificate not found." };
  }

  // The id comes from the client, so it is only a lookup key: ownership is
  // checked against the signed-in organization before anything is sent. A
  // certificate that belongs to someone else gets the same "not found"
  // answer as one that doesn't exist, so ids can't be probed.
  const certificate = await getCertificateById(certificateId);
  if (
    !certificate ||
    !(await certificateBelongsToOrganization(
      certificate.certificateId,
      currentUser.organization.organizationId
    ))
  ) {
    return { ok: false, message: "Certificate not found." };
  }

  if (getCertificateStatus(certificate) === "revoked") {
    return { ok: false, message: "A revoked certificate can't be emailed." };
  }

  const outcome = toEmailOutcome(
    await emailCertificateToRecipient(certificate, currentUser.organization.organizationId),
    certificate.recipientEmail
  );
  return { ok: outcome.sent, message: outcome.message };
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

  let blockchainRecord;
  try {
    blockchainRecord = await contractService.revokeCertificate(certificateId);
  } catch (err) {
    // Keep PostgreSQL and the chain in agreement: since the on-chain
    // revoke did not confirm, undo the DB flag too instead of showing a
    // certificate as revoked when the blockchain never recorded it.
    await markCertificateReactivated(certificateId);
    return {
      error: `Revocation failed: the blockchain transaction did not confirm (${blockchainErrorMessage(
        err
      )}). The certificate's status was not changed.`,
    };
  }

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

export interface ReactivateResult {
  error?: string;
}

export async function reactivateCertificate(certificateId: string): Promise<ReactivateResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "You must be signed in to reactivate a certificate." };
  }

  const certificate = await getCertificateById(certificateId);
  if (!certificate) {
    return { error: "Certificate not found." };
  }

  await markCertificateReactivated(certificateId);

  let blockchainRecord;
  try {
    blockchainRecord = await contractService.reactivateCertificate(certificateId);
  } catch (err) {
    await markCertificateRevoked(certificateId);
    return {
      error: `Reactivation failed: the blockchain transaction did not confirm (${blockchainErrorMessage(
        err
      )}). The certificate's status was not changed.`,
    };
  }

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
