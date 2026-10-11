-- Notificações administrativas apenas para pagamentos confirmados.
-- Uma linha por pedido impede envios duplicados após repetição do webhook.
CREATE TABLE IF NOT EXISTS store_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sale_alerts (
  order_id TEXT PRIMARY KEY REFERENCES orders(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','processing','sent','error')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  sent_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sale_alerts_retry ON sale_alerts(status,updated_at);
