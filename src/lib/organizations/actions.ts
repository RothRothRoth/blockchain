"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth/current-user";
import { updateCertificatePrefix, setOrganizationMailCredentials } from "../db/organizations";
import { isValidEmail, normalizeAppPassword, verifyMailAccount } from "../email/certificate-email";
import { encryptSecret } from "../security/secret-box";

export interface UpdateCertificatePrefixState {
  error?: string;
  success?: boolean;
}

const PREFIX_PATTERN = /^[A-Za-z0-9/-]{1,16}$/;

export async function updateCertificatePrefixAction(
  _prevState: UpdateCertificatePrefixState,
  formData: FormData
): Promise<UpdateCertificatePrefixState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "You must be signed in to change this." };
  }

  const raw = String(formData.get("certificatePrefix") ?? "").trim();

  if (raw && !PREFIX_PATTERN.test(raw)) {
    return {
      error: "Use up to 16 characters: letters, numbers, \"-\", and \"/\" only.",
    };
  }

  await updateCertificatePrefix(currentUser.organization.organizationId, raw || null);
  revalidatePath("/settings");
  revalidatePath("/certificates/issue");

  return { success: true };
}

export interface MailAccountState {
  error?: string;
  success?: string;
}

/**
 * Connects the institute's own Gmail account for sending certificates. The
 * login is checked with Gmail before anything is saved, and the App Password
 * is stored encrypted — it is never returned to the browser afterwards.
 */
export async function connectMailAccountAction(
  _prevState: MailAccountState,
  formData: FormData
): Promise<MailAccountState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "You must be signed in to change this." };
  }

  const mailUser = String(formData.get("mailUser") ?? "").trim();
  const password = normalizeAppPassword(String(formData.get("mailPassword") ?? ""));

  if (!isValidEmail(mailUser)) {
    return { error: "Enter the Gmail address you want certificates to be sent from." };
  }
  if (!password) {
    return { error: "Enter the App Password for that account." };
  }
  if (password.length > 128) {
    return { error: "That App Password looks too long. Google App Passwords are 16 letters." };
  }

  const verified = await verifyMailAccount(mailUser, password);
  if (!verified.ok) {
    return { error: verified.message };
  }

  await setOrganizationMailCredentials(
    currentUser.organization.organizationId,
    mailUser,
    encryptSecret(password)
  );
  revalidatePath("/settings");
  revalidatePath("/certificates/issue");

  return { success: `Connected. Certificates will now be sent from ${mailUser}.` };
}

export async function disconnectMailAccountAction(): Promise<MailAccountState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "You must be signed in to change this." };
  }

  await setOrganizationMailCredentials(currentUser.organization.organizationId, null, null);
  revalidatePath("/settings");
  revalidatePath("/certificates/issue");

  return { success: "Disconnected." };
}
