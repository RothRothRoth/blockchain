-- CertifyChain database schema.
-- Matches the ER design from the project spec exactly: same entities,
-- same snake_case field names. Primary keys are UUIDs (gen_random_uuid()
-- is built into PostgreSQL 13+, no extension needed).

DROP TABLE IF EXISTS blockchain_transaction CASCADE;
DROP TABLE IF EXISTS qr_code CASCADE;
DROP TABLE IF EXISTS certificate_document CASCADE;
DROP TABLE IF EXISTS certificate CASCADE;
DROP TABLE IF EXISTS recipient CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organization CASCADE;

CREATE TABLE organization (
  organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "user" is a reserved word, so the table is named `users`; it maps to the
-- spec's User entity (organization_id FK, name, email, password_hash).
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization (organization_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipient (
  recipient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL
);

CREATE TABLE certificate (
  certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization (organization_id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES recipient (recipient_id) ON DELETE RESTRICT,
  issued_by UUID NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
  certificate_title TEXT NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  issue_date DATE NOT NULL,
  expiration_date DATE,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE certificate_document (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES certificate (certificate_id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE qr_code (
  qr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES certificate (certificate_id) ON DELETE CASCADE,
  verification_url TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE blockchain_transaction (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES certificate (certificate_id) ON DELETE CASCADE,
  transaction_hash TEXT NOT NULL,
  blockchain_cert_id TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_organization ON users (organization_id);
CREATE INDEX idx_certificate_organization ON certificate (organization_id);
CREATE INDEX idx_certificate_recipient ON certificate (recipient_id);
CREATE INDEX idx_certificate_document_certificate ON certificate_document (certificate_id);
CREATE INDEX idx_qr_code_certificate ON qr_code (certificate_id);
CREATE INDEX idx_blockchain_transaction_certificate ON blockchain_transaction (certificate_id);
