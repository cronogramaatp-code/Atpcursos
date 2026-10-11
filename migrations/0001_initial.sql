-- ATPCursos isolated D1 schema. No shared Cronograma ATP tables.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
 category TEXT NOT NULL, discipline TEXT DEFAULT '', contest TEXT DEFAULT '',
 description TEXT NOT NULL DEFAULT '', price_cents INTEGER NOT NULL CHECK(price_cents>=100),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 original_key TEXT, page_count INTEGER DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY, buyer_name TEXT NOT NULL, buyer_email TEXT NOT NULL,
 buyer_email_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','checkout_failed','paid','delivered','refunded')),
 total_cents INTEGER NOT NULL CHECK(total_cents>0), full_cents INTEGER NOT NULL,
 discount_cents INTEGER NOT NULL DEFAULT 0, discount_rate INTEGER NOT NULL DEFAULT 0,
 provider_order_nsu TEXT NOT NULL UNIQUE, transaction_nsu TEXT UNIQUE,
 paid_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_email_hash,status);
CREATE INDEX IF NOT EXISTS idx_orders_paid_date ON orders(paid_at,status);
CREATE TABLE IF NOT EXISTS order_items (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id),
 product_id TEXT NOT NULL REFERENCES products(id), title_snapshot TEXT NOT NULL,
 price_snapshot_cents INTEGER NOT NULL, original_key_snapshot TEXT NOT NULL,
 UNIQUE(order_id,product_id)
);
CREATE TABLE IF NOT EXISTS deliveries (
 id TEXT PRIMARY KEY, order_item_id TEXT NOT NULL UNIQUE REFERENCES order_items(id),
 order_id TEXT NOT NULL REFERENCES orders(id), status TEXT NOT NULL DEFAULT 'pending'
 CHECK(status IN('pending','processing','sent','error','revoked')),
 personalized_key TEXT, error_code TEXT, sent_at TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS download_tokens (
 token_hash TEXT PRIMARY KEY, delivery_id TEXT NOT NULL REFERENCES deliveries(id),
 expires_at INTEGER NOT NULL, remaining_uses INTEGER NOT NULL,
 revoked_at INTEGER
);
CREATE TABLE IF NOT EXISTS payment_events(
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id),
 transaction_nsu TEXT, provider_amount_cents INTEGER, status TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS presence (
 session_hash TEXT PRIMARY KEY, last_seen_unix INTEGER NOT NULL,
 path_group TEXT NOT NULL DEFAULT 'store'
);
CREATE INDEX IF NOT EXISTS idx_presence_live ON presence(last_seen_unix);
CREATE TABLE IF NOT EXISTS audit_logs (
 id TEXT PRIMARY KEY, action TEXT NOT NULL, actor TEXT NOT NULL,
 target TEXT NOT NULL, at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
