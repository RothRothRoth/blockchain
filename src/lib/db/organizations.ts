import { pool } from "./pool";

export interface Organization {
  organizationId: string;
  organizationName: string;
  email: string;
}

export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  const { rows } = await pool.query(
    `SELECT organization_id, organization_name, email
     FROM organization
     WHERE organization_id = $1`,
    [organizationId]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    email: row.email,
  };
}

export async function getOrganizationByEmail(email: string): Promise<Organization | null> {
  const { rows } = await pool.query(
    `SELECT organization_id, organization_name, email
     FROM organization
     WHERE email = $1`,
    [email]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    email: row.email,
  };
}

export async function createOrganization(
  organizationName: string,
  email: string
): Promise<Organization> {
  const { rows } = await pool.query(
    `INSERT INTO organization (organization_name, email)
     VALUES ($1, $2)
     RETURNING organization_id, organization_name, email`,
    [organizationName, email]
  );
  const row = rows[0];
  return {
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    email: row.email,
  };
}
