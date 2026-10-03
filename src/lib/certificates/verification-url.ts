/**
 * The public address verification links and QR codes point to.
 *
 * Order: APP_BASE_URL, then Vercel's production URL (set automatically on
 * Vercel), then localhost in development only. In production with none of
 * those set this returns null instead of quietly producing localhost links
 * that would only work on the developer's own machine.
 */
export function getBaseUrl(): string | null {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return process.env.NODE_ENV === "production" ? null : "http://localhost:3000";
}

export function buildVerificationUrl(certificateId: string): string | null {
  const base = getBaseUrl();
  return base ? `${base}/verify/${certificateId}` : null;
}
