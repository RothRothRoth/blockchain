import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Encrypts small secrets (an institute's Gmail App Password) before they go
 * into PostgreSQL, so a database dump alone doesn't expose them. The key is
 * derived from SESSION_SECRET, which the app already requires. Rotating
 * SESSION_SECRET makes stored secrets undecryptable; institutes then just
 * reconnect their account in Settings.
 */
function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return createHash("sha256").update(`certi-secret-box:${secret}`).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

/** Returns null if the value is malformed, tampered with, or the key changed. */
export function decryptSecret(payload: string): string | null {
  try {
    const [iv, tag, encrypted] = payload.split(".").map((part) => Buffer.from(part, "base64url"));
    if (!iv || !tag || !encrypted) return null;
    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
