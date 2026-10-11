"""Staging migration smoke test; no production data."""
import sqlite3
from pathlib import Path

root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for file in sorted((root/"migrations").glob("*.sql")):
    db.executescript(file.read_text(encoding="utf-8"))
tables={x[0] for x in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
required={"products","orders","customers","courtesy_grants","courtesy_download_tokens","customer_action_tokens","customer_sessions","customer_login_limits"}
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
print("PASS: migrations 0001-0003; unique grant, zero revenue, all tables created")
