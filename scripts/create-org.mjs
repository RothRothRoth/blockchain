// Creates a new organization (institution) and its first user account.
// This is the "manual/admin provisioning" step for onboarding a new
// institution — there is no public sign-up page by design (see project
// spec: only Organization and Public User roles exist, and organizations
// are vetted/created directly, not self-registered).
//
// Usage:
//   npm run db:create-org -- "Institute Name" "org@institute.edu" "Your Name" "you@institute.edu" "yourPassword"
//
// If an organization with that email already exists, the new user is added
// to it instead of creating a duplicate organization.
import { Client } from "pg";
import bcrypt from "bcryptjs";

const [orgName, orgEmail, userName, userEmail, password] = process.argv.slice(2);

if (!orgName || !orgEmail || !userName || !userEmail || !password) {
  console.error(
    'Usage: npm run db:create-org -- "Institute Name" "org@institute.edu" "Your Name" "you@institute.edu" "yourPassword"'
  );
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");

    const { rows: existingOrgRows } = await client.query(
      `SELECT organization_id FROM organization WHERE email = $1`,
      [orgEmail]
    );

    let organizationId;
    if (existingOrgRows.length > 0) {
      organizationId = existingOrgRows[0].organization_id;
      console.log(`Organization "${orgEmail}" already exists — adding user to it.`);
    } else {
      const { rows: [org] } = await client.query(
        `INSERT INTO organization (organization_name, email) VALUES ($1, $2)
         RETURNING organization_id`,
        [orgName, orgEmail]
      );
      organizationId = org.organization_id;
      console.log(`Created organization "${orgName}".`);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO users (organization_id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [organizationId, userName, userEmail, passwordHash]
    );

    await client.query("COMMIT");
    console.log(`Created user "${userEmail}".`);
    console.log(`\nLog in at /login with:\n  Email: ${userEmail}\n  Password: ${password}`);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      console.error(`\nA user with email "${userEmail}" already exists.`);
      process.exit(1);
    }
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
