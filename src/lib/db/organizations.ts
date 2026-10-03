import { pool } from "./pool";
import { decryptSecret } from "../security/secret-box";

export interface Organization {
  organizationId: string;
  organizationName: string;
  email: string;
  certificatePrefix: string | null;
  /** The institute's connected Gmail address (not secret). The password is never part of this object. */
  mailUser: string | null;
}

const ORGANIZATION_COLUMNS = `organization_id, organization_name, email, certificate_prefix, mail_user`;

function mapRow(row: Record<string, unknown>): Organization {
  return {
    organizationId: row.organization_id as string,
    organizationName: row.organization_name as string,
    email: row.email as string,
    certificatePrefix: (row.certificate_prefix as string | null) ?? null,
    mailUser: (row.mail_user as string | null) ?? null,
  };
}

export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  const { rows } = await pool.query(
    `SELECT ${ORGANIZATION_COLUMNS}
     FROM organization
     WHERE organization_id = $1`,
    [organizationId]
  );
  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

export async function getOrganizationByEmail(email: string): Promise<Organization | null> {
  const { rows } = await pool.query(
    `SELECT ${ORGANIZATION_COLUMNS}
     FROM organization
     WHERE email = $1`,
    [email]
  );
  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

export async function createOrganization(
  organizationName: string,
  email: string
): Promise<Organization> {
  const { rows } = await pool.query(
    `INSERT INTO organization (organization_name, email)
     VALUES ($1, $2)
     RETURNING ${ORGANIZATION_COLUMNS}`,
    [organizationName, email]
  );
  return mapRow(rows[0]);
}

export async function updateCertificatePrefix(
  organizationId: string,
  certificatePrefix: string | null
): Promise<void> {
  await pool.query(`UPDATE organization SET certificate_prefix = $1 WHERE organization_id = $2`, [
    certificatePrefix,
    organizationId,
  ]);
}

/** Server-only: returns the decrypted App Password, so never pass this to a client component. */
export async function getOrganizationMailCredentials(
  organizationId: string
): Promise<{ user: string; password: string } | null> {
  const { rows } = await pool.query(
    `SELECT mail_user, mail_password_encrypted FROM organization WHERE organization_id = $1`,
    [organizationId]
  );
  const row = rows[0];
  if (!row?.mail_user || !row?.mail_password_encrypted) return null;
  const password = decryptSecret(row.mail_password_encrypted as string);
  if (!password) return null;
  return { user: row.mail_user as string, password };
}

export async function setOrganizationMailCredentials(
  organizationId: string,
  mailUser: string | null,
  encryptedPassword: string | null
): Promise<void> {
  await pool.query(
    `UPDATE organization SET mail_user = $1, mail_password_encrypted = $2 WHERE organization_id = $3`,
    [mailUser, encryptedPassword, organizationId]
  );
}
