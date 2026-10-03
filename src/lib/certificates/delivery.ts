import { Certificate } from "../types";
import { generateQrCodeDataUrl } from "../qrcode";
import { generateCertificatePdf } from "../pdf/certificate-pdf";
import { getOrganizationMailCredentials } from "../db/organizations";
import { EmailResult, MailAccount, sendCertificateEmail } from "../email/certificate-email";

/**
 * Regenerates the certificate PDF with the same generator used by the
 * download routes, then emails it from the issuing institute's own connected
 * Gmail account (falling back to server-wide settings if it hasn't connected
 * one). Delivery is strictly downstream of issuance: nothing here changes
 * certificate data in PostgreSQL or on the blockchain, and any failure comes
 * back as a typed result instead of throwing.
 */
export async function emailCertificateToRecipient(
  certificate: Certificate,
  organizationId: string
): Promise<EmailResult> {
  let pdfBytes: Uint8Array;
  try {
    const qrDataUrl = await generateQrCodeDataUrl(certificate.verificationUrl);
    pdfBytes = await generateCertificatePdf(certificate, qrDataUrl);
  } catch (err) {
    console.error(
      `[email] PDF generation failed for certificate ${certificate.certificateId}:`,
      err instanceof Error ? err.message : err
    );
    return {
      ok: false,
      reason: "pdf_failed",
      message: "The certificate PDF could not be generated, so the email was not sent.",
    };
  }

  let account: MailAccount | null = null;
  try {
    const credentials = await getOrganizationMailCredentials(organizationId);
    if (credentials) {
      account = { ...credentials, displayName: certificate.organizationName };
    }
  } catch (err) {
    console.error(
      `[email] Could not load the mail account for organization ${organizationId}:`,
      err instanceof Error ? err.message : err
    );
  }

  return sendCertificateEmail(certificate, pdfBytes, account);
}
