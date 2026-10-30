-- Administrator PIN is a second gate after Cloudflare Access, never its replacement.
-- The identity is HMAC pseudonymized, no raw PIN or admin email stored in D1.
CREATE TABLE IF NOT EXISTS admin_pin_accounts(
 identity_hash TEXT PRIMARY KEY,
 pin_salt TEXT NOT NULL,
 pin_digest TEXT NOT NULL,
 pin_iterations INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_pin_tokens(
 token_hash TEXT PRIMARY KEY,
 identity_hash TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 used_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_pin_tokens_identity ON admin_pin_tokens(identity_hash,expires_at);
CREATE TABLE IF NOT EXISTS admin_pin_sessions(
 token_hash TEXT PRIMARY KEY,
 identity_hash TEXT NOT NULL REFERENCES admin_pin_accounts(identity_hash),
 expires_at INTEGER NOT NULL,
 revoked_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_pin_sessions_identity ON admin_pin_sessions(identity_hash,expires_at);
CREATE TABLE IF NOT EXISTS admin_pin_login_limits(
 identity_hash TEXT PRIMARY KEY,
 window_start INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0)
);
