import { Pool } from "pg";

// Cached on `globalThis` so `next dev`'s module reloading doesn't open a new
// connection pool on every edit.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
