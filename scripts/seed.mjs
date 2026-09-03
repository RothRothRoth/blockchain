// Development seed data. Run with: npm run db:seed
// Populates one organization, two users, and a handful of certificates in
// varying statuses (valid / expired / revoked) so the UI has realistic data
// to render without needing a real issuance flow first.
import { Client } from "pg";
import bcrypt from "bcryptjs";

const DEMO_PASSWORD = "password123";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "TRUNCATE blockchain_transaction, qr_code, certificate_document, certificate, recipient, users, organization RESTART IDENTITY CASCADE"
    );

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const { rows: [org] } = await client.query(
      `INSERT INTO organization (organization_name, email)
       VALUES ($1, $2) RETURNING organization_id`,
      ["Metro Technical Institute", "admissions@metrotechnical.edu"]
    );

    const { rows: [fischer] } = await client.query(
      `INSERT INTO users (organization_id, name, email, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING user_id`,
      [org.organization_id, "Dr. Lena Fischer", "lena.fischer@metrotechnical.edu", passwordHash]
    );

    const { rows: [webb] } = await client.query(
      `INSERT INTO users (organization_id, name, email, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING user_id`,
      [org.organization_id, "Marcus Webb", "marcus.webb@metrotechnical.edu", passwordHash]
    );

    const certificates = [
      {
        recipient: ["Amara Okoye", "amara.okoye@example.com"],
        issuedBy: fischer.user_id,
        title: "Full-Stack Web Development",
        number: "MTI-2026-00142",
        issueDate: "2026-06-15",
        expirationDate: "2029-06-15",
        revoked: false,
      },
      {
        recipient: ["Daniel Torres", "daniel.torres@example.com"],
        issuedBy: fischer.user_id,
        title: "Data Analytics Fundamentals",
        number: "MTI-2026-00141",
        issueDate: "2026-05-20",
        expirationDate: "2027-05-20",
        revoked: false,
      },
      {
        recipient: ["Priya Sharma", "priya.sharma@example.com"],
        issuedBy: webb.user_id,
        title: "Introduction to Cybersecurity",
        number: "MTI-2025-00098",
        issueDate: "2025-03-10",
        expirationDate: "2026-03-10",
        revoked: false,
      },
      {
        recipient: ["James Whitfield", "james.whitfield@example.com"],
        issuedBy: webb.user_id,
        title: "Project Management Essentials",
        number: "MTI-2025-00076",
        issueDate: "2025-01-22",
        expirationDate: "2026-01-22",
        revoked: false,
      },
      {
        recipient: ["Sofia Marino", "sofia.marino@example.com"],
        issuedBy: fischer.user_id,
        title: "UI / UX Design Principles",
        number: "MTI-2026-00139",
        issueDate: "2026-04-02",
        expirationDate: "2028-04-02",
        revoked: true,
        revokedAt: "2026-07-01T11:20:00Z",
      },
      {
        recipient: ["Ethan Brooks", "ethan.brooks@example.com"],
        issuedBy: fischer.user_id,
        title: "Cloud Computing with AWS",
        number: "MTI-2026-00150",
        issueDate: "2026-08-11",
        expirationDate: "2029-08-11",
        revoked: false,
      },
      {
        recipient: ["Grace Kim", "grace.kim@example.com"],
        issuedBy: webb.user_id,
        title: "Network Administration",
        number: "MTI-2024-00031",
        issueDate: "2024-02-14",
        expirationDate: "2025-02-14",
        revoked: false,
      },
      {
        recipient: ["Liam Bennett", "liam.bennett@example.com"],
        issuedBy: fischer.user_id,
        title: "Digital Marketing Strategy",
        number: "MTI-2026-00145",
        issueDate: "2026-07-05",
        expirationDate: null,
        revoked: false,
      },
    ];

    for (const cert of certificates) {
      const { rows: [recipient] } = await client.query(
        `INSERT INTO recipient (name, email) VALUES ($1, $2) RETURNING recipient_id`,
        cert.recipient
      );

      const { rows: [row] } = await client.query(
        `INSERT INTO certificate
           (organization_id, recipient_id, issued_by, certificate_title, certificate_number,
            issue_date, expiration_date, revoked_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING certificate_id, created_at`,
        [
          org.organization_id,
          recipient.recipient_id,
          cert.issuedBy,
          cert.title,
          cert.number,
          cert.issueDate,
          cert.expirationDate,
          cert.revoked ? cert.revokedAt ?? new Date().toISOString() : null,
        ]
      );

      const verificationUrl = `http://localhost:3000/verify/${row.certificate_id}`;

      await client.query(
        `INSERT INTO qr_code (certificate_id, verification_url) VALUES ($1, $2)`,
        [row.certificate_id, verificationUrl]
      );

      await client.query(
        `INSERT INTO certificate_document (certificate_id, pdf_url) VALUES ($1, $2)`,
        [row.certificate_id, `/certificates/${row.certificate_id}/document.pdf`]
      );

      const fakeHash = "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");

      await client.query(
        `INSERT INTO blockchain_transaction (certificate_id, transaction_hash, blockchain_cert_id, recorded_at)
         VALUES ($1, $2, $3, $4)`,
        [row.certificate_id, fakeHash, cert.number, row.created_at]
      );
    }

    await client.query("COMMIT");
    console.log(`Seeded organization "${org.organization_id}" with ${certificates.length} certificates.`);
    console.log(`Demo login: lena.fischer@metrotechnical.edu / ${DEMO_PASSWORD}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
