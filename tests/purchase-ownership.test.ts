import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { secretHash } from "../src/domain/customer";
import { emailHash } from "../src/infra";
import { applyAction, myAccount, purchaseFileDownload } from "../src/customer-public";

const shopKey="only-this-shop-hmac";
const accountId="22222222-2222-4222-8222-222222222222";
const otherId="33333333-3333-4333-8333-333333333333";
const orderId="44444444-4444-4444-8444-444444444444";
const productId="55555555-5555-4555-8555-555555555555";
const itemId="66666666-6666-4666-8666-666666666666";
const fileId="77777777-7777-4777-8777-777777777777";
const deliveryId="88888888-8888-4888-8888-888888888888";
const oldEmail="antigo@example.com";
const newEmail="novo@example.com";
const secret="a".repeat(64);

async function fixture(activated=true){
 const db=new DatabaseSync(":memory:");
 for(const name of ["0001_initial.sql","0002_courtesies_accounts.sql","0003_login_throttle.sql","0004_sale_alerts.sql","0005_multi_pdf_bundles.sql","0006_admin_pin.sql","0007_customer_order_ownership.sql"])
  db.exec(readFileSync(new URL("../migrations/"+name,import.meta.url),"utf8"));
 const origHash=await emailHash(oldEmail,shopKey);
 db.prepare("INSERT INTO customers(id,full_name,email,email_hash,password_digest) VALUES(?,?,?,?,?)").run(accountId,"Aluno",oldEmail,origHash,activated?"verified-pin-hash":null);
 db.prepare("INSERT INTO customer_sessions(token_hash,customer_id,expires_at) VALUES(?,?,?)").run(await secretHash(secret),accountId,2100000000);
 db.prepare("INSERT INTO products(id,slug,title,category,price_cents,status) VALUES(?,?,?,?,?,?)").run(productId,"material","Material","Apostilas",3700,"published");
 db.prepare("INSERT INTO orders(id,buyer_name,buyer_email,buyer_email_hash,status,total_cents,full_cents,provider_order_nsu) VALUES(?,?,?,?,?,?,?,?)").run(orderId,"Aluno",oldEmail,origHash,"delivered",3700,3700,orderId);
 db.prepare("INSERT INTO order_items(id,order_id,product_id,title_snapshot,price_snapshot_cents,original_key_snapshot) VALUES(?,?,?,?,?,?)").run(itemId,orderId,productId,"Material",3700,"originals/test.pdf");
 db.prepare("INSERT INTO order_item_files(id,order_item_id,title_snapshot,original_key_snapshot,position) VALUES(?,?,?,?,?)").run(fileId,itemId,"Apostila","originals/test.pdf",0);
 db.prepare("INSERT INTO bundle_deliveries(id,order_item_file_id,order_id,status,personalized_key) VALUES(?,?,?,?,?)").run(deliveryId,fileId,orderId,"sent","personalized-bundles/test.pdf");
 const rawToken="b".repeat(64);
 db.prepare("INSERT INTO customer_action_tokens(token_hash,customer_id,action,pending_email,expires_at) VALUES(?,?,?,?,?)").run(await secretHash(rawToken),accountId,"email_change",newEmail,2100000000);
 const prepare=(sql:string)=>{
  const stmt=db.prepare(sql);
  return {bind(...args:unknown[]){
   return {
    async first(){return stmt.get(...(args as any[]));},
    async all(){return {results:stmt.all(...(args as any[]))};},
    async run(){const r=stmt.run(...(args as any[]));return {meta:{changes:r.changes}};}
   };
  }};
 };
 const env:any={BUYER_HASH_KEY:shopKey,DB:{
  prepare,
  async batch(ops:any[]){db.exec("BEGIN");try{const output=[];for(const op of ops)output.push(await op.run());db.exec("COMMIT");return output;}catch(err){db.exec("ROLLBACK");throw err;}}
 },PDFS:{async get(key:string){return key==="personalized-bundles/test.pdf"?{body:new Blob(["test"]).stream()}:null;}}};
 const req=(path:string,cookieValue=secret)=>new Request("https://atpconcursos.example"+path,{headers:{cookie:"atp_customer_session="+cookieValue}});
 return {db,env,req,rawToken};
}

test("confirmed email change preserves historical PDFs for an activated student",async()=>{
 const f=await fixture();
 try {
  const before=await myAccount(f.req("/api/customer/me"),f.env);
  assert.equal((await before.json() as any).purchases.length,1);
  const tokenReq=new Request("https://atpconcursos.example/api/customer/action/email_change",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:f.rawToken})});
  const changed=await applyAction(tokenReq,f.env,"email_change");
  assert.equal(changed.status,200);
  assert.equal((f.db.prepare("SELECT customer_id FROM customer_order_links WHERE order_id=?").get(orderId) as any)?.customer_id,accountId);
  const newSession="c".repeat(64);
  f.db.prepare("INSERT INTO customer_sessions(token_hash,customer_id,expires_at) VALUES(?,?,?)").run(await secretHash(newSession),accountId,2100000000);
  const after=await myAccount(f.req("/api/customer/me",newSession),f.env);
  assert.equal(after.status,200);
  assert.equal((await after.json() as any).purchases.length,1);
  assert.equal((await purchaseFileDownload(f.req("/x",newSession),f.env,"bundle",deliveryId)).status,200);
 }finally{f.db.close();}
});

test("an old email reused by a different account cannot take already-linked purchases",async()=>{
 const f=await fixture();
 try{
  const tokenReq=new Request("https://atpconcursos.example/api/customer/action/email_change",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:f.rawToken})});
  assert.equal((await applyAction(tokenReq,f.env,"email_change")).status,200);
  const oldHash=await emailHash(oldEmail,shopKey);
  f.db.prepare("INSERT INTO customers(id,full_name,email,email_hash,password_digest) VALUES(?,?,?,?,?)").run(otherId,"Outro",oldEmail,oldHash,"verified");
  const otherSecret="d".repeat(64);
  f.db.prepare("INSERT INTO customer_sessions(token_hash,customer_id,expires_at) VALUES(?,?,?)").run(await secretHash(otherSecret),otherId,2100000000);
  const list=await myAccount(f.req("/api/customer/me",otherSecret),f.env);
  assert.deepEqual((await list.json() as any).purchases,[]);
  assert.equal((await purchaseFileDownload(f.req("/x",otherSecret),f.env,"bundle",deliveryId)).status,403);
  assert.throws(()=>f.db.prepare("INSERT INTO customer_order_links(order_id,customer_id) VALUES(?,?)").run(orderId,otherId));
  assert.throws(()=>f.db.prepare("UPDATE customer_order_links SET customer_id=? WHERE order_id=?").run(otherId,orderId));
 }finally{f.db.close();}
});

test("an unactivated account cannot silently claim someone else's historical purchases on admin email change",async()=>{
 const f=await fixture(false);
 try {
  const tokenReq=new Request("https://atpconcursos.example/api/customer/action/email_change",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:f.rawToken})});
  assert.equal((await applyAction(tokenReq,f.env,"email_change")).status,200);
  assert.equal((f.db.prepare("SELECT COUNT(*) AS n FROM customer_order_links").get() as {n:number}).n,0);
 }finally{f.db.close();}
});
