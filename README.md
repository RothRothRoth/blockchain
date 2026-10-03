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
| Email delivery | Real, via Resend: the certificate PDF and verification link are emailed after issuance (see **Email Setup**) |

## Email Setup

After a certificate is issued, the recipient is emailed the certificate PDF
(attached) together with the certificate ID and a public verification link.
Email is a delivery step only: if it fails, the certificate stays issued in
PostgreSQL and on the blockchain, and it can be re-sent from the certificate's
detail page ("Resend Certificate").

### Recommended: each institute connects its own Gmail (no `.env` changes)

Log in, open **Settings → Email Delivery**, and connect the institute's Gmail
account. Certificates are then sent from that Gmail address, under the
institute's name, to any applicant.

1. Turn on **2-Step Verification** on the Gmail account (Google requires it).
2. Create an **App Password** at myaccount.google.com/apppasswords (16 letters;
   a separate password, not the normal one).
3. Enter the Gmail address and App Password in Settings and click **Connect Gmail**.
   The login is checked with Google before anything is saved, and the App Password
   is stored encrypted (AES-256-GCM, key derived from `SESSION_SECRET`) and never
   shown again. If you ever change `SESSION_SECRET`, reconnect the account.

Each institute has its own account, so one institute can't send as another.
Gmail limits sending to roughly 500 messages per day per account.

### Server-wide fallback (optional)

If an institute hasn't connected an account, the server falls back to the
settings below: SMTP if `SMTP_USER` and `SMTP_PASS` are set, otherwise Resend.
Restart `npm run dev` after editing `.env.local`. In every case, make sure
`APP_BASE_URL` is the app's public URL: the verification link in the email is
built from it. It is `http://localhost:3000` in local development, so links in
those emails only open on your own machine.

### Option A: Gmail SMTP for the whole server

1. In your Google account, turn on **2-Step Verification**.
2. Create an **App Password** at myaccount.google.com/apppasswords (16 letters).
3. Add to `.env.local` (server-side only; never commit it):

```
SMTP_USER=you@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

Mail is sent from that Gmail account, so recipients see it as coming from you.
Gmail limits sending to roughly 500 messages per day. `SMTP_HOST`, `SMTP_PORT`
and `SMTP_FROM` are optional and default to `smtp.gmail.com`, `465` and
`Certi <SMTP_USER>`; set them to use a different SMTP provider.

### Option B: Resend

1. Create a free account at [resend.com](https://resend.com).
2. In the Resend dashboard, create an API key (**API Keys**).
3. Add it to `.env.local` as `RESEND_API_KEY` (server-side only; never commit it).
4. Set `RESEND_FROM_EMAIL` to the sender address, e.g.
   `Certi <certificates@your-verified-domain.com>`.

```
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

**Limits of the Resend account you use:**

- To email arbitrary recipients you must add and verify a sending domain in Resend
  and use an address on that domain in `RESEND_FROM_EMAIL`.
- Without a verified domain, Resend only allows its shared test sender
  (`onboarding@resend.dev`) and only delivers to the email address your Resend
  account was registered with. For a university demonstration, issuing a
  certificate to that address is enough to show the full flow.
- If the variables are missing or Resend rejects the send, issuing still works;
  the page reports that the email was not sent and offers a resend button.

## Deploying to Vercel

The app is a standard Next.js project, so Vercel builds it with no extra
configuration. Three things are not Vercel-hosted and must exist first.

1. **A hosted PostgreSQL database** (Neon, Supabase, Vercel Postgres, ...). Use
   its connection string, with `?sslmode=require` if the provider needs SSL.
   Create the tables **once** against that empty database (the schema script
   drops tables first, so never run it against a database that has data):
   ```bash
   DATABASE_URL="postgresql://..." node scripts/apply-schema.mjs
   ```
2. **A public blockchain network** (for example Sepolia). The local Hardhat node
   can't be reached from Vercel. Deploy the contract with
   `onchain/hardhat.config.js` (its `sepolia` network reads `SEPOLIA_RPC_URL`
   and `DEPLOYER_PRIVATE_KEY`), and fund the wallet that will sign transactions
   with test ETH from a faucet.
3. **An email sender** (see Email Setup above): a Gmail App Password is enough.

Then add these in **Vercel -> Project -> Settings -> Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the hosted database connection string |
| `SESSION_SECRET` | a new random value (never reuse your local one) |
| `APP_BASE_URL` | your live URL, e.g. `https://your-app.vercel.app` |
| `BLOCKCHAIN_RPC_URL` | the network's RPC URL |
| `BLOCKCHAIN_PRIVATE_KEY` | the funded wallet's key (a real secret; never commit it) |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | the address printed when you deployed |
| `SMTP_USER`, `SMTP_PASS` | the sending Gmail address and its App Password |
| `REGISTRATION_INVITE_CODE` | optional; see below |

Notes:

- **Registration is closed in production unless you set `REGISTRATION_INVITE_CODE`.**
  Create the first institution from your own machine, pointed at the hosted
  database: `DATABASE_URL="postgresql://..." node scripts/create-org.mjs "Institute Name" "org@institute.edu" "Your Name" "you@institute.edu" "a-strong-password"`.
- Issuing, revoking and reactivating wait for a blockchain confirmation, so those
  pages ask for up to 60 seconds. Vercel's plan limits apply to that.
- Blockchain error details are written to the server log only; visitors see a
  generic message, because provider errors can contain the RPC URL and its key.
- Changing an environment variable on Vercel needs a redeploy to take effect.
