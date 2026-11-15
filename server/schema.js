// Cardify database tables (Cloudflare D1). The server creates them automatically on the
// first request, so there is nothing to run by hand.

export const SCHEMA = `

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  org TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS login_attempts (
  email TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS login_attempts_email ON login_attempts (email, at);

CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL,          -- in halalas (100 = 1 SAR)
  badge_ar TEXT NOT NULL DEFAULT '',
  badge_en TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  package_id INTEGER,
  package_name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  amount INTEGER NOT NULL,         -- halalas
  status TEXT NOT NULL,            -- pending | paid | failed
  invoice_id TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);
CREATE INDEX IF NOT EXISTS orders_user ON orders (user_id, created_at);
CREATE INDEX IF NOT EXISTS orders_invoice ON orders (invoice_id);

CREATE TABLE IF NOT EXISTS credit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,            -- signup | purchase | issue | admin | refund
  ref TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS credit_log_user ON credit_log (user_id, created_at);

-- One issuing = one design used for one or more names.
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL DEFAULT '',
  design TEXT NOT NULL,            -- JSON: everything needed to redraw the certificate
  count INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS batches_user ON batches (user_id, created_at);

CREATE TABLE IF NOT EXISTS certificates (
  serial TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  recipient TEXT NOT NULL,
  issued_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS certificates_batch ON certificates (batch_id);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS media_user ON media (user_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
