-- Multi-PDF bundles, append-only snapshots for new purchases.
-- Do not rebuild legacy deliveries or touch paid orders.
CREATE TABLE IF NOT EXISTS product_files (
 id TEXT PRIMARY KEY,
 product_id TEXT NOT NULL REFERENCES products(id),
 title TEXT NOT NULL,
 original_key TEXT NOT NULL UNIQUE,
 page_count INTEGER NOT NULL DEFAULT 0,
 size_bytes INTEGER NOT NULL DEFAULT 0,
 position INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_files_product ON product_files(product_id,position,created_at);

-- Existing single-file products stay sellable without altering their keys.
INSERT OR IGNORE INTO product_files(id,product_id,title,original_key,page_count,size_bytes,position)
SELECT 'legacy-'||id,id,title,original_key,COALESCE(page_count,0),0,0
FROM products WHERE original_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS order_item_files (
 id TEXT PRIMARY KEY,
 order_item_id TEXT NOT NULL REFERENCES order_items(id),
 product_file_id TEXT REFERENCES product_files(id),
 title_snapshot TEXT NOT NULL,
 original_key_snapshot TEXT NOT NULL,
 position INTEGER NOT NULL,
 UNIQUE(order_item_id,position)
);
CREATE INDEX IF NOT EXISTS idx_order_item_files_item ON order_item_files(order_item_id,position);

CREATE TABLE IF NOT EXISTS bundle_deliveries (
 id TEXT PRIMARY KEY,
 order_item_file_id TEXT NOT NULL UNIQUE REFERENCES order_item_files(id),
 order_id TEXT NOT NULL REFERENCES orders(id),
 status TEXT NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','processing','ready','sent','error','revoked')),
 personalized_key TEXT,
 error_code TEXT,
 sent_at TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bundle_deliveries_order ON bundle_deliveries(order_id,status);

CREATE TABLE IF NOT EXISTS bundle_download_tokens (
 token_hash TEXT PRIMARY KEY,
 delivery_id TEXT NOT NULL REFERENCES bundle_deliveries(id),
 expires_at INTEGER NOT NULL,
 remaining_uses INTEGER NOT NULL,
 revoked_at INTEGER
);
CREATE TABLE IF NOT EXISTS bundle_notifications (
 order_id TEXT PRIMARY KEY REFERENCES orders(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','processing','sent','error')),
 sent_at TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
