# Certi — Blockchain-Based Digital Certificate Issuing Platform

A university project: educational institutions issue digital certificates through
an **Organization Portal**, and anyone can verify a certificate's authenticity
through a public **Certificate Verification** page — no account required.

## Quick Start

```bash
npm install

# 1. Point at your local PostgreSQL instance
cp .env.example .env.local
# edit .env.local: DATABASE_URL, SESSION_SECRET, APP_BASE_URL

# 2. Create the tables
npm run db:schema

# 3. Load demo data (one org, two users, eight certificates)
npm run db:seed

# 4. Run it
npm run dev
```

Demo login: `lena.fischer@metrotechnical.edu` / `password123`.

## Project Structure

Everything under `src/` is organized by **what it does**, not by page — a page
in `src/app` wires together data (`src/lib/db`), auth (`src/lib/auth`), and UI
(`src/components`), but never contains SQL or session logic itself.

```
src/
├── app/                          Routes (Next.js App Router — folders = URLs)
│   ├── page.tsx                     Public landing page ("/")
│   ├── login/page.tsx                Organization login ("/login")
│   ├── verify/                       Public verification — no auth required
│   │   ├── page.tsx                     Search by certificate ID ("/verify")
│   │   └── [certificateId]/page.tsx     Verification result ("/verify/:id")
│   ├── (org)/                        Organization Portal — auth required
│   │   ├── layout.tsx                   Sidebar/nav shell + session check
│   │   ├── dashboard/page.tsx           Stats + recent certificates
│   │   └── certificates/
│   │       ├── page.tsx                 Issued certificates table
│   │       ├── issue/page.tsx           Issue Certificate form
│   │       └── [id]/page.tsx            Certificate details + revoke
│   ├── layout.tsx                    Root HTML shell, fonts, metadata
│   └── globals.css                   Tailwind entry point
│
├── components/                  Presentational building blocks — no data fetching
│   ├── ui/                          Generic: Button, Card, Modal, FormField, StatusBadge, Logo
│   ├── certificates/                 Certificate-specific: CertificateTable, RevokeModal, QrPlaceholder
│   └── layout/                       OrgShell (sidebar), PublicHeader
│
├── lib/                          Everything that isn't UI
│   ├── db/                          All SQL lives here — pages never write queries directly
│   │   ├── pool.ts                     Postgres connection pool (singleton)
│   │   ├── organizations.ts            Organization lookups
│   │   ├── users.ts                    User lookups (for auth)
│   │   └── certificates.ts             Certificate CRUD, dashboard stats
│   ├── auth/                        Custom session auth (no third-party library)
│   │   ├── session.ts                  Sign/verify the HMAC session cookie
│   │   ├── current-user.ts             getCurrentUser() — reads the cookie, loads the user
│   │   └── actions.ts                  Server Actions: login(), logout()
│   ├── certificates/actions.ts      Server Actions: issueCertificate(), revokeCertificate()
│   ├── blockchain/contract-service.ts  Mock "Contract Service" — the seam where a real
│   │                                    smart-contract client will plug in later
│   ├── types.ts                     Shared TypeScript types (Certificate, etc.)
│   ├── certificate-status.ts        Pure function: derives Valid/Expired/Revoked
│   └── format.ts                    Date formatting helpers
│
└── proxy.ts                     Route guard for the Organization Portal (Next.js 16
                                   renamed "middleware.ts" to "proxy.ts")

sql/schema.sql                  Table definitions — matches the ER diagram exactly
scripts/
├── apply-schema.mjs               Runs sql/schema.sql against DATABASE_URL
└── seed.mjs                       Populates demo data
```

### Why it's split this way

- **`app/` only renders.** Every page either reads from `lib/db` directly (Server
  Components) or calls a `lib/*/actions.ts` Server Action for mutations. No page
  writes a SQL query or reads a cookie by hand.
- **`lib/db/` is the only place SQL exists.** If the database schema changes,
  this is the only folder that needs to change.
- **`lib/auth/` is intentionally small and dependency-free** — bcrypt + a
  signed cookie, no NextAuth — per the project spec's "don't introduce
  unnecessary technologies" rule.
- **`lib/blockchain/contract-service.ts` is a deliberate seam.** The rest of
  the app calls `mockContractService.issueCertificate()` /
  `.revokeCertificate()` and stores whatever comes back. Swapping in a real
  blockchain client means editing this one file — nothing else changes.

## Architecture

```
Organization User          Public User
      │                         │
      ▼                         ▼
 /login, /dashboard,       /verify, /verify/[id]
 /certificates/*           (no auth)
      │                         │
      └───────────┬─────────────┘
                   ▼
           Next.js Web App
          (Server Components +
           Server Actions)
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   PostgreSQL   Contract    (future: PDF
   (src/lib/db)  Service     generator,
               (src/lib/     QR generator,
               blockchain)   email service)
                   │
                   ▼
             Smart Contract
              (mocked today)
                   │
                   ▼
               Blockchain
```

PostgreSQL holds all operational data (organizations, users, recipients,
certificates, QR/document references, blockchain transaction references). The
blockchain — accessed only through the Contract Service — holds the
tamper-resistant record used for verification. Public users never touch the
database or the blockchain directly; every request goes through the web app.

## What's real vs. placeholder

| Feature | Status |
|---|---|
| PostgreSQL schema, queries, transactions | Real |
| Login (bcrypt + signed session cookie) | Real |
| Issue / list / view / revoke certificates | Real, persisted to Postgres |
| Blockchain transaction hash | Real return value, but from a **mock** Contract Service (no real chain yet) |
| Public verification | Real, reads live data |
| PDF download | Disabled — PDF generation not built yet |
| QR code image | Decorative placeholder — not a scannable code |
| Email notification | Not built yet |
