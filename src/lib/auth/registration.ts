import { createHash, timingSafeEqual } from "node:crypto";

export type RegistrationMode = "open" | "invite" | "closed";

/**
 * Who may create a new institution at /register.
 * - REGISTRATION_INVITE_CODE set: only people who know the code ("invite").
 * - Not set, in production: nobody ("closed"). Institutions are then created
 *   with `npm run db:create-org`, so a public site can't be used to register
 *   an institute and issue or revoke certificates in its name.
 * - Not set, in development: open, for local testing.
 */
export function getRegistrationMode(): RegistrationMode {
  if (process.env.REGISTRATION_INVITE_CODE?.trim()) return "invite";
  return process.env.NODE_ENV === "production" ? "closed" : "open";
}

export function isInviteCodeValid(input: string): boolean {
  const expected = process.env.REGISTRATION_INVITE_CODE?.trim();
  if (!expected) return false;
  // Hash both sides so the comparison is constant-time even for different lengths.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
