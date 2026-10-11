-- Per-email HMAC rate limiting for optional student password sign-in.
CREATE TABLE IF NOT EXISTS customer_login_limits (
 email_hash TEXT PRIMARY KEY,
 window_start INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0)
);
