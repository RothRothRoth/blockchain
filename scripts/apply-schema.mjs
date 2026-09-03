// Applies sql/schema.sql to the database in DATABASE_URL.
// Run with: npm run db:schema
import { readFileSync } from "node:fs";
import { Client } from "pg";

async function main() {
  const schema = readFileSync(new URL("../sql/schema.sql", import.meta.url), "utf8");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(schema);
    console.log("Schema applied.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
