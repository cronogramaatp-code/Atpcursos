-- ATPCursos: buyer optional account, courtesy grants and admin-controlled recovery.
-- NEVER count courtesy entitlements as paid orders or revenue.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  email_hash TEXT NOT NULL UNIQUE,
  password_salt TEXT,
  password_digest TEXT,
  password_iterations INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(full_name);
CREATE TABLE IF NOT EXISTS courtesy_grants (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
  granted_by TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  expires_at INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_courtesy_customer ON courtesy_grants(customer_id, status);
CREATE TABLE IF NOT EXISTS courtesy_download_tokens (
  token_hash TEXT PRIMARY KEY,
  grant_id TEXT NOT NULL REFERENCES courtesy_grants(id),
  expires_at INTEGER NOT NULL,
  remaining_uses INTEGER NOT NULL CHECK(remaining_uses>=0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_courtesy_tokens_grant ON courtesy_download_tokens(grant_id);
CREATE TABLE IF NOT EXISTS customer_action_tokens (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  action TEXT NOT NULL CHECK(action IN ('password_reset','email_change')),
  pending_email TEXT,
  expires_at INTEGER NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customer_tokens ON customer_action_tokens(customer_id, action);
CREATE TABLE IF NOT EXISTS customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  expires_at INTEGER NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customer_sessions ON customer_sessions(customer_id, expires_at);
