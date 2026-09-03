import { pool } from "./pool";
import { PoolClient } from "pg";
import { ActivityEvent, Certificate, DashboardStats } from "../types";

const SELECT_CERTIFICATE = `
  SELECT
    c.certificate_id,
    c.certificate_number,
    c.certificate_title,
    c.issue_date,
    c.expiration_date,
    c.revoked_at,
    c.created_at,
    r.name AS recipient_name,
    r.email AS recipient_email,
    o.organization_name,
    u.name AS issued_by_name,
    qr.verification_url,
    bt.transaction_hash,
    bt.blockchain_cert_id,
    bt.recorded_at AS blockchain_recorded_at
  FROM certificate c
  JOIN recipient r ON r.recipient_id = c.recipient_id
  JOIN organization o ON o.organization_id = c.organization_id
  JOIN users u ON u.user_id = c.issued_by
  LEFT JOIN qr_code qr ON qr.certificate_id = c.certificate_id
  LEFT JOIN LATERAL (
    SELECT transaction_hash, blockchain_cert_id, recorded_at
    FROM blockchain_transaction bt
    WHERE bt.certificate_id = c.certificate_id
    ORDER BY bt.recorded_at DESC
    LIMIT 1
  ) bt ON true
`;

function mapRow(row: Record<string, unknown>): Certificate {
  return {
    certificateId: row.certificate_id as string,
    certificateNumber: row.certificate_number as string,
    recipientName: row.recipient_name as string,
    recipientEmail: row.recipient_email as string,
    certificateTitle: row.certificate_title as string,
    organizationName: row.organization_name as string,
    issuedBy: row.issued_by_name as string,
    issueDate: toIsoDate(row.issue_date),
    expirationDate: row.expiration_date ? toIsoDate(row.expiration_date) : null,
    revokedAt: row.revoked_at ? (row.revoked_at as Date).toISOString() : null,
    createdAt: (row.created_at as Date).toISOString(),
    verificationUrl: (row.verification_url as string) ?? "",
    blockchain: {
      transactionHash: (row.transaction_hash as string) ?? "",
      blockchainCertId: (row.blockchain_cert_id as string) ?? "",
      recordedAt: row.blockchain_recorded_at
        ? (row.blockchain_recorded_at as Date).toISOString()
        : "",
    },
  };
}

function toIsoDate(value: unknown): string {
  // node-postgres parses `date` columns into a Date built from local-time
  // fields (new Date(year, month, day)), not UTC midnight. Reading it back
  // with local getters (not toISOString, which converts to UTC) is what
  // keeps the calendar date from shifting by a day around the server's
  // timezone offset.
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value);
}

export async function listCertificatesByOrganization(
  organizationId: string
): Promise<Certificate[]> {
  const { rows } = await pool.query(
    `${SELECT_CERTIFICATE} WHERE c.organization_id = $1 ORDER BY c.created_at DESC`,
    [organizationId]
  );
  return rows.map(mapRow);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getCertificateById(certificateId: string): Promise<Certificate | null> {
  // certificate_id is a uuid column; a malformed id (e.g. a mistyped public
  // lookup) would otherwise throw a Postgres "invalid input syntax" error.
  if (!UUID_PATTERN.test(certificateId)) return null;

  const { rows } = await pool.query(`${SELECT_CERTIFICATE} WHERE c.certificate_id = $1`, [
    certificateId,
  ]);
  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

/**
 * Real activity events only — a certificate being issued (created_at) or
 * revoked (revoked_at). "Expired" is deliberately not included here: it's a
 * derived state (current date vs. expiration_date), not something that
 * happened at a recorded point in time, so there's no honest timestamp to
 * show for it.
 */
export async function getRecentActivity(
  organizationId: string,
  limit: number
): Promise<ActivityEvent[]> {
  const { rows } = await pool.query(
    `SELECT * FROM (
       SELECT 'issued' AS type, c.certificate_id, r.name AS recipient_name,
              c.certificate_title, c.created_at AS occurred_at
       FROM certificate c
       JOIN recipient r ON r.recipient_id = c.recipient_id
       WHERE c.organization_id = $1
       UNION ALL
       SELECT 'revoked' AS type, c.certificate_id, r.name AS recipient_name,
              c.certificate_title, c.revoked_at AS occurred_at
       FROM certificate c
       JOIN recipient r ON r.recipient_id = c.recipient_id
       WHERE c.organization_id = $1 AND c.revoked_at IS NOT NULL
     ) events
     ORDER BY occurred_at DESC
     LIMIT $2`,
    [organizationId, limit]
  );
  return rows.map((row) => ({
    type: row.type,
    certificateId: row.certificate_id,
    recipientName: row.recipient_name,
    certificateTitle: row.certificate_title,
    occurredAt: (row.occurred_at as Date).toISOString(),
  }));
}

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (
         WHERE revoked_at IS NULL
           AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
       )::int AS valid,
       COUNT(*) FILTER (
         WHERE revoked_at IS NULL AND expiration_date < CURRENT_DATE
       )::int AS expired,
       COUNT(*) FILTER (WHERE revoked_at IS NOT NULL)::int AS revoked
     FROM certificate
     WHERE organization_id = $1`,
    [organizationId]
  );
  const row = rows[0];
  return {
    total: row.total,
    valid: row.valid,
    expired: row.expired,
    revoked: row.revoked,
  };
}

export interface IssueCertificateInput {
  organizationId: string;
  issuedByUserId: string;
  recipientName: string;
  recipientEmail: string;
  certificateTitle: string;
  certificateNumber: string;
  issueDate: string;
  expirationDate: string | null;
}

export async function insertCertificate(
  input: IssueCertificateInput,
  verificationUrlFor: (certificateId: string) => string
): Promise<{ certificateId: string; createdAt: string }> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      rows: [recipient],
    } = await client.query(
      `INSERT INTO recipient (name, email) VALUES ($1, $2) RETURNING recipient_id`,
      [input.recipientName, input.recipientEmail]
    );

    const {
      rows: [cert],
    } = await client.query(
      `INSERT INTO certificate
         (organization_id, recipient_id, issued_by, certificate_title, certificate_number,
          issue_date, expiration_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING certificate_id, created_at`,
      [
        input.organizationId,
        recipient.recipient_id,
        input.issuedByUserId,
        input.certificateTitle,
        input.certificateNumber,
        input.issueDate,
        input.expirationDate,
      ]
    );

    await client.query(`INSERT INTO qr_code (certificate_id, verification_url) VALUES ($1, $2)`, [
      cert.certificate_id,
      verificationUrlFor(cert.certificate_id),
    ]);

    await client.query("COMMIT");
    return {
      certificateId: cert.certificate_id,
      createdAt: (cert.created_at as Date).toISOString(),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function recordBlockchainTransaction(
  certificateId: string,
  transactionHash: string,
  blockchainCertId: string
): Promise<void> {
  await pool.query(
    `INSERT INTO blockchain_transaction (certificate_id, transaction_hash, blockchain_cert_id)
     VALUES ($1, $2, $3)`,
    [certificateId, transactionHash, blockchainCertId]
  );
}

export async function markCertificateRevoked(certificateId: string): Promise<void> {
  await pool.query(
    `UPDATE certificate SET revoked_at = now() WHERE certificate_id = $1 AND revoked_at IS NULL`,
    [certificateId]
  );
}
