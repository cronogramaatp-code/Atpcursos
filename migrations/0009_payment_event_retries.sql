-- atpconcursos: bounded, fair retries for durable InfinitePay webhook events.
-- No destructive changes to historical events, orders or production data.
CREATE TABLE IF NOT EXISTS payment_event_retries (
 event_id TEXT PRIMARY KEY REFERENCES payment_events(id),
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
 last_attempt_unix INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_payment_event_retry_attempts ON payment_event_retries(attempts,last_attempt_unix);
