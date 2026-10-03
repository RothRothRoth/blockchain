import { Resend } from "resend";
import nodemailer from "nodemailer";
import { Certificate } from "../types";
import { formatDate } from "../format";

export type EmailFailureReason =
  | "not_configured"
  | "invalid_recipient"
  | "invalid_link"
  | "pdf_failed"
  | "send_failed";

export type EmailResult =
  | { ok: true; recipient: string }
  | { ok: false; reason: EmailFailureReason; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeFilename(certificateNumber: string): string {
  return `certificate-${certificateNumber.replace(/[^A-Za-z0-9._-]/g, "_")}.pdf`;
}

/** Uses the verification URL stored with the certificate; only falls back to APP_BASE_URL if it is missing. */
function resolveVerificationUrl(certificate: Certificate): string | null {
  let candidate = certificate.verificationUrl;
  if (!candidate && process.env.APP_BASE_URL) {
    candidate = `${process.env.APP_BASE_URL.replace(/\/+$/, "")}/verify/${certificate.certificateId}`;
  }
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function buildEmailContent(certificate: Certificate, verificationUrl: string) {
  const issueDate = formatDate(certificate.issueDate, "long");
  const name = escapeHtml(certificate.recipientName);
  const org = escapeHtml(certificate.organizationName);
  const title = escapeHtml(certificate.certificateTitle);
  const number = escapeHtml(certificate.certificateNumber);
  const link = escapeHtml(verificationUrl);

  const subject = `Your Certificate Has Been Issued: ${certificate.certificateNumber}`;

  const text = [
    `Hello ${certificate.recipientName},`,
    "",
    `Your certificate "${certificate.certificateTitle}" has been successfully issued by ${certificate.organizationName}.`,
    "",
    `Certificate ID: ${certificate.certificateNumber}`,
    `Issue Date: ${issueDate}`,
    "",
    "Your certificate is attached to this email as a PDF.",
    "",
    "You can verify the authenticity of your certificate using the following link:",
    verificationUrl,
    "",
    "Thank you,",
    certificate.organizationName,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr><td style="background:#115e59;height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td style="padding:28px 32px;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hello ${name},</p>
                <p style="margin:0 0 20px;">Your certificate <strong>${title}</strong> has been successfully issued by <strong>${org}</strong>.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;font-size:14px;">
                  <tr><td style="padding:2px 16px 2px 0;color:#475569;">Certificate ID</td><td style="padding:2px 0;font-family:Consolas,Menlo,monospace;"><strong>${number}</strong></td></tr>
                  <tr><td style="padding:2px 16px 2px 0;color:#475569;">Issue Date</td><td style="padding:2px 0;"><strong>${escapeHtml(issueDate)}</strong></td></tr>
                </table>
                <p style="margin:0 0 20px;">Your certificate is attached to this email as a PDF.</p>
                <p style="margin:0 0 12px;">You can verify the authenticity of your certificate using the following link:</p>
                <p style="margin:0 0 20px;">
                  <a href="${link}" style="display:inline-block;background:#115e59;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;">Verify Certificate</a>
                </p>
                <p style="margin:0 0 24px;font-size:13px;color:#475569;word-break:break-all;">${link}</p>
                <p style="margin:0;">Thank you,<br />${org}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  pdfFilename: string;
  pdfBytes: Uint8Array;
  /** For server-side log lines only. */
  logId: string;
}

type TransportOutcome = { ok: true } | { ok: false; message: string };

/**
 * Resend's own error text can be technical; this maps the cases a user can
 * act on to a safe message and keeps everything else generic. The full
 * detail is logged server-side, never returned to the client.
 */
function userMessageForResendError(error: {
  name?: string;
  message?: string;
  statusCode?: number | null;
}): string {
  const message = (error.message ?? "").toLowerCase();
  if (message.includes("testing emails") || message.includes("verify a domain")) {
    return "The email service only allows sending to the account owner's address until a sending domain is verified. See the Email Setup section of the README.";
  }
  if (error.statusCode === 401 || error.statusCode === 403) {
    return "The email service rejected the server's credentials. Check RESEND_API_KEY.";
  }
  if (error.statusCode === 422 || error.name === "validation_error") {
    return "The email service rejected this email. Check the recipient address and the configured sender address.";
  }
  return "The email service could not deliver the message. Please try again.";
}

function userMessageForSmtpError(error: { code?: string; responseCode?: number }): string {
  if (error.code === "EAUTH") {
    return "The mail server rejected the login. Gmail needs a 16-letter App Password (not your normal password); reconnect the account in Settings.";
  }
  if (error.code === "EENVELOPE" || (error.responseCode !== undefined && error.responseCode >= 550 && error.responseCode < 560)) {
    return "The mail server rejected the recipient address. Check that it is correct.";
  }
  if (
    error.code === "ECONNECTION" ||
    error.code === "ETIMEDOUT" ||
    error.code === "ESOCKET" ||
    error.code === "EDNS"
  ) {
    return "Couldn't reach the mail server. Check SMTP_HOST / SMTP_PORT and your internet connection.";
  }
  return "The mail server could not deliver the message. Please try again.";
}

async function sendViaResend(
  apiKey: string,
  from: string,
  message: EmailMessage
): Promise<TransportOutcome> {
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: [
        {
          filename: message.pdfFilename,
          content: Buffer.from(message.pdfBytes),
          contentType: "application/pdf",
        },
      ],
    });
    if (error) {
      console.error(
        `[email] Resend rejected the send for certificate ${message.logId}:`,
        error.name,
        error.statusCode,
        error.message
      );
      return { ok: false, message: userMessageForResendError(error) };
    }
    return { ok: true };
  } catch (err) {
    console.error(
      `[email] Resend send failed for certificate ${message.logId}:`,
      err instanceof Error ? err.message : err
    );
    return { ok: false, message: "Couldn't reach the email service. Please try again." };
  }
}

/** An institute's own mail account, connected on the Settings page. */
export interface MailAccount {
  user: string;
  password: string;
  displayName: string;
}

interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string | { name: string; address: string };
}

/**
 * Host and port come from the server's environment (default: Gmail), never
 * from anything a user types in, so institutes can't point the server at an
 * arbitrary host.
 */
function smtpEndpoint(): { host: string; port: number } {
  return {
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
  };
}

/** Google shows App Passwords in groups of four with spaces; the spaces aren't part of the password. */
export function normalizeAppPassword(password: string): string {
  return password.replace(/\s+/g, "");
}

function settingsFromAccount(account: MailAccount): SmtpSettings {
  return {
    ...smtpEndpoint(),
    user: account.user,
    pass: normalizeAppPassword(account.password),
    from: { name: account.displayName, address: account.user },
  };
}

/** Server-wide SMTP: used when SMTP_USER and SMTP_PASS are set. */
function readSmtpSettings(): SmtpSettings | null {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return null;
  return {
    ...smtpEndpoint(),
    user,
    pass: normalizeAppPassword(pass),
    from: process.env.SMTP_FROM?.trim() || `Certi <${user}>`,
  };
}

/** True when the server itself can send mail (SMTP_* or RESEND_* set), with no institute account connected. */
export function isSharedEmailConfigured(): boolean {
  return (
    readSmtpSettings() !== null ||
    Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim())
  );
}

function createSmtpTransport(settings: Pick<SmtpSettings, "host" | "port" | "user" | "pass">) {
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: { user: settings.user, pass: settings.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

/**
 * Logs in to the mail server without sending anything, so a wrong App
 * Password is caught when the institute connects the account instead of
 * later when a certificate fails to send.
 */
export async function verifyMailAccount(
  user: string,
  password: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await createSmtpTransport({
      ...smtpEndpoint(),
      user,
      pass: normalizeAppPassword(password),
    }).verify();
    return { ok: true };
  } catch (err) {
    const e = err as { code?: string; responseCode?: number; message?: string };
    console.error("[email] Mail account verification failed:", e.code, e.responseCode, e.message);
    return { ok: false, message: userMessageForSmtpError(e) };
  }
}

async function sendViaSmtp(settings: SmtpSettings, message: EmailMessage): Promise<TransportOutcome> {
  try {
    const transporter = createSmtpTransport(settings);
    await transporter.sendMail({
      from: settings.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: [
        {
          filename: message.pdfFilename,
          content: Buffer.from(message.pdfBytes),
          contentType: "application/pdf",
        },
      ],
    });
    return { ok: true };
  } catch (err) {
    const e = err as { code?: string; responseCode?: number; message?: string };
    console.error(
      `[email] SMTP send failed for certificate ${message.logId}:`,
      e.code,
      e.responseCode,
      e.message
    );
    return { ok: false, message: userMessageForSmtpError(e) };
  }
}

/**
 * Sends the certificate PDF to the recipient. Server-only: credentials are
 * never sent to the browser. Sender priority: the institute's own connected
 * account (`account`), then server-wide SMTP (SMTP_USER/SMTP_PASS), then
 * Resend (RESEND_API_KEY/RESEND_FROM_EMAIL). This never throws, so callers
 * get a typed result and a delivery problem can never undo an
 * already-issued certificate.
 */
export async function sendCertificateEmail(
  certificate: Certificate,
  pdfBytes: Uint8Array,
  account?: MailAccount | null
): Promise<EmailResult> {
  const smtp = account ? settingsFromAccount(account) : readSmtpSettings();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();

  if (!smtp && !(resendKey && resendFrom)) {
    console.error(
      "[email] Not configured: no institute mail account, no SMTP_USER/SMTP_PASS, and no RESEND_API_KEY/RESEND_FROM_EMAIL."
    );
    return {
      ok: false,
      reason: "not_configured",
      message:
        "Email isn't set up yet. Connect your Gmail account in Settings so certificates can be emailed.",
    };
  }

  const recipient = certificate.recipientEmail.trim();
  if (!isValidEmail(recipient)) {
    return {
      ok: false,
      reason: "invalid_recipient",
      message: "The recipient's email address is not valid.",
    };
  }

  const verificationUrl = resolveVerificationUrl(certificate);
  if (!verificationUrl) {
    console.error(`[email] No usable verification URL for certificate ${certificate.certificateId}.`);
    return {
      ok: false,
      reason: "invalid_link",
      message: "The certificate's verification link is missing or invalid, so the email was not sent.",
    };
  }

  const { subject, text, html } = buildEmailContent(certificate, verificationUrl);
  const message: EmailMessage = {
    to: recipient,
    subject,
    text,
    html,
    pdfFilename: safeFilename(certificate.certificateNumber),
    pdfBytes,
    logId: certificate.certificateId,
  };

  const outcome = smtp
    ? await sendViaSmtp(smtp, message)
    : await sendViaResend(resendKey as string, resendFrom as string, message);

  return outcome.ok
    ? { ok: true, recipient }
    : { ok: false, reason: "send_failed", message: outcome.message };
}
