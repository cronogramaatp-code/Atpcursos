import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { quote } from "../src/checkout";
import { emailHash } from "../src/infra";

test("emailHash uses HMAC SHA-256 and normalizes buyer email", async () => {
  const first = await emailHash("  ALUNO@example.com  ", "unit-test-key");
  const second = await emailHash("aluno@example.com", "unit-test-key");
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(first, second);
});

const itemId = "11111111-1111-4111-8111-111111111111";
const email = "aluno@example.com";

function fixture(fileCount: number, originalKey: string | null = null) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE products (id TEXT PRIMARY KEY, title TEXT, price_cents INTEGER, original_key TEXT, status TEXT);
    CREATE TABLE product_files (id TEXT PRIMARY KEY, product_id TEXT, title TEXT, original_key TEXT, position INTEGER, created_at TEXT);
    CREATE TABLE orders (buyer_email_hash TEXT, status TEXT);
  `);
  sqlite.prepare("INSERT INTO products (id,title,price_cents,original_key,status) VALUES (?,?,?,?,?)")
    .run(itemId, "Combo 4 Simulados", 3700, originalKey, "published");
  for (let index = 0; index < fileCount; index++) {
    sqlite.prepare("INSERT INTO product_files (id,product_id,title,original_key,position,created_at) VALUES (?,?,?,?,?,?)")
      .run(String(index), itemId, "Arquivo " + index, "originals/" + index + ".pdf", index, "2026-10-29");
  }
  const db = {
    prepare(query: string) {
      const stmt = sqlite.prepare(query);
      return {
        bind(...args: unknown[]) {
          return {
            async first() { return stmt.get(...(args as Array<string | number | null>)); },
            async all() { return { results: stmt.all(...(args as Array<string | number | null>)) }; }
          };
        }
      };
    }
  };
  return { sqlite, env: { DB: db, BUYER_HASH_KEY: "only-for-unit-test" } as any };
}

test("quote accepts a published eight-PDF bundle with a null legacy original_key", async () => {
  const { sqlite, env } = fixture(8);
  try {
    const result = await quote(env, email, [itemId]);
    assert.equal(result.products.length, 1);
    assert.equal(result.products[0].original_key, "originals/0.pdf");
    assert.equal(result.pricing.totalCents, 3700);
  } finally {
    sqlite.close();
  }
});

test("quote refuses a published product without linked PDFs even with a legacy key", async () => {
  const { sqlite, env } = fixture(0, "originals/stale.pdf");
  try {
    await assert.rejects(() => quote(env, email, [itemId]), /invalid order/);
  } finally {
    sqlite.close();
  }
});
