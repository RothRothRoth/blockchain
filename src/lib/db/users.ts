import { pool } from "./pool";

export interface UserWithCredentials {
  userId: string;
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface AuthUser {
  userId: string;
  organizationId: string;
  name: string;
  email: string;
}

export async function getUserByEmail(email: string): Promise<UserWithCredentials | null> {
  const { rows } = await pool.query(
    `SELECT user_id, organization_id, name, email, password_hash
     FROM users
     WHERE email = $1`,
    [email]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    userId: row.user_id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
  };
}

export async function createUser(
  organizationId: string,
  name: string,
  email: string,
  passwordHash: string
): Promise<AuthUser> {
  const { rows } = await pool.query(
    `INSERT INTO users (organization_id, name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, organization_id, name, email`,
    [organizationId, name, email, passwordHash]
  );
  const row = rows[0];
  return {
    userId: row.user_id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
  };
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const { rows } = await pool.query(
    `SELECT user_id, organization_id, name, email
     FROM users
     WHERE user_id = $1`,
    [userId]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    userId: row.user_id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
  };
}
