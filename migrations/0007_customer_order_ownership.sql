-- atpconcursos: immutable ownership claim for purchased orders.
-- No automatic historical backfill, no changes to customers/orders, no cross-project access.
CREATE TABLE IF NOT EXISTS customer_order_links (
 order_id TEXT PRIMARY KEY REFERENCES orders(id),
 customer_id TEXT NOT NULL REFERENCES customers(id),
 claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customer_order_links_customer ON customer_order_links(customer_id,claimed_at);
-- Even a mistaken UPDATE must not transfer an already-claimed paid order.
CREATE TRIGGER IF NOT EXISTS deny_customer_order_owner_transfer
BEFORE UPDATE OF customer_id ON customer_order_links
WHEN NEW.customer_id <> OLD.customer_id
BEGIN
 SELECT RAISE(ABORT, 'order ownership is immutable');
END;
