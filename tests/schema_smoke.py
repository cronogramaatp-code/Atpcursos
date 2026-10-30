"""Staging migration smoke test; no production data."""
import sqlite3
from pathlib import Path

root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for file in sorted((root/"migrations").glob("*.sql")):
    db.executescript(file.read_text(encoding="utf-8"))
tables={x[0] for x in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
required={"products","orders","customers","courtesy_grants","courtesy_download_tokens","customer_action_tokens","customer_sessions","customer_login_limits","store_settings","sale_alerts","product_files","order_item_files","bundle_deliveries","bundle_download_tokens","bundle_notifications","admin_pin_accounts","admin_pin_tokens","admin_pin_sessions","admin_pin_login_limits","customer_order_links"}
assert required <= tables, required-tables
p="11111111-1111-4111-8111-111111111111"
c="22222222-2222-4222-8222-222222222222"
g="33333333-3333-4333-8333-333333333333"
db.execute("INSERT INTO products(id,slug,title,category,price_cents,status,original_key) VALUES(?,?,?,?,?,?,?)",(p,"teste","Teste","Simulados",1000,"published","originals/test.pdf"))
db.execute("INSERT INTO customers(id,full_name,email,email_hash) VALUES(?,?,?,?)",(c,"Teste Aluno","aluno@example.org","hashed-email"))
db.execute("INSERT INTO courtesy_grants(id,customer_id,product_id,granted_by) VALUES(?,?,?,?)",(g,c,p,"admin@example.org"))
try:
    db.execute("INSERT INTO courtesy_grants(id,customer_id,product_id,granted_by) VALUES(?,?,?,?)",("44444444-4444-4444-8444-444444444444",c,p,"admin@example.org"))
    raise AssertionError("duplicate grant allowed")
except sqlite3.IntegrityError: pass
count=db.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
assert count==0, "courtesy should never create a sale"
# Confirm the administrative sale alert is unique per verified order.
order_id="88888888-8888-4888-8888-888888888888"
db.execute("INSERT INTO orders(id,buyer_name,buyer_email,buyer_email_hash,status,total_cents,full_cents,provider_order_nsu) VALUES(?,?,?,?,?,?,?,?)",
 (order_id,"Comprador Teste","comprador@example.org","hash-test","paid",9800,12000,order_id))
db.execute("INSERT INTO sale_alerts(order_id,status) VALUES(?,'pending')",(order_id,))
db.execute("INSERT OR IGNORE INTO sale_alerts(order_id,status) VALUES(?,'pending')",(order_id,))
assert db.execute("SELECT COUNT(*) FROM sale_alerts WHERE order_id=?",(order_id,)).fetchone()[0]==1
# Validate migrations 0005 and 0006, including privacy and relational integrity.
db.executescript((root/"migrations"/"0005_multi_pdf_bundles.sql").read_text(encoding="utf-8"))
legacy=db.execute("SELECT id,original_key FROM product_files WHERE product_id=?",(p,)).fetchall()
assert len(legacy)==1 and legacy[0][1]=="originals/test.pdf", "legacy PDFs must be available as product_files"
identity="a"*64
db.execute("INSERT INTO admin_pin_accounts(identity_hash,pin_salt,pin_digest,pin_iterations) VALUES(?,?,?,?)",(identity,"b"*64,"c"*64,310000))
db.execute("INSERT INTO admin_pin_sessions(token_hash,identity_hash,expires_at) VALUES(?,?,?)",("d"*64,identity,2100000000))
try:
    db.execute("INSERT INTO admin_pin_sessions(token_hash,identity_hash,expires_at) VALUES(?,?,?)",("e"*64,"other",2100000000))
    raise AssertionError("admin PIN session accepted unknown identity")
except sqlite3.IntegrityError: pass
try:
    db.execute("INSERT INTO admin_pin_login_limits(identity_hash,window_start,attempts) VALUES(?,?,?)",(identity,2100000000,-1))
    raise AssertionError("negative login attempts accepted")
except sqlite3.IntegrityError: pass
# Re-running the newest additive migration must not change data.
db.executescript((root/"migrations"/"0006_admin_pin.sql").read_text(encoding="utf-8"))
assert db.execute("SELECT COUNT(*) FROM admin_pin_accounts").fetchone()[0]==1
assert db.execute("SELECT COUNT(*) FROM admin_pin_sessions").fetchone()[0]==1
# Ownership is immutable by order: duplicate claims cannot transfer access.
db.execute("INSERT INTO customer_order_links(order_id,customer_id) VALUES(?,?)",(order_id,c))
db.execute("INSERT OR IGNORE INTO customer_order_links(order_id,customer_id) VALUES(?,?)",(order_id,c))
assert db.execute("SELECT COUNT(*) FROM customer_order_links WHERE order_id=?",(order_id,)).fetchone()[0]==1
try:
    db.execute("INSERT INTO customer_order_links(order_id,customer_id) VALUES(?,?)",("missing-order",c))
    raise AssertionError("foreign key on order missing")
except sqlite3.IntegrityError: pass
try:
    db.execute("INSERT INTO customer_order_links(order_id,customer_id) VALUES(?,?)",("missing-order","missing-customer"))
    raise AssertionError("ownership accepted unknown customer")
except sqlite3.IntegrityError: pass
db.executescript((root/"migrations"/"0007_customer_order_ownership.sql").read_text(encoding="utf-8"))
assert db.execute("SELECT customer_id FROM customer_order_links WHERE order_id=?",(order_id,)).fetchone()[0]==c
print("PASS: migrations 0001-0007; purchases ownership, bundle legacy, permissions, sessions, retries and sale alerts")
