import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { receiveWebhook,reconcile } from "../src/checkout";

const orderId="11111111-1111-4111-8111-111111111111";
const migrationFiles=["0001_initial.sql","0002_courtesies_accounts.sql","0003_login_throttle.sql","0004_sale_alerts.sql","0005_multi_pdf_bundles.sql","0006_admin_pin.sql","0007_customer_order_ownership.sql","0008_product_publication_guards.sql","0009_payment_event_retries.sql"];

function fixture(){
 const sqlite=new DatabaseSync(":memory:");
 sqlite.exec("PRAGMA foreign_keys=ON");
 for(const file of migrationFiles)sqlite.exec(readFileSync("migrations/"+file,"utf8"));
 sqlite.prepare("INSERT INTO orders(id,buyer_name,buyer_email,buyer_email_hash,status,total_cents,full_cents,provider_order_nsu) VALUES(?,?,?,?,?,?,?,?)")
  .run(orderId,"Comprador","comprador@example.test","secure-hash","pending",3700,3700,orderId);
 const prepare=(sql:string)=>{
  const statement=sqlite.prepare(sql);
  let args:any[]=[];
  const self={
   bind(...values:any[]){args=values;return self;},
   async first(){return statement.get(...args);},
   async all(){return {results:statement.all(...args)};},
   async run(){const r=statement.run(...args);return {meta:{changes:r.changes}};}
  };
  return self;
 };
 const env:any={DB:{prepare},INFINITEPAY_HANDLE:""};
 const waits:Promise<unknown>[]=[];
 const ctx:any={waitUntil(p:Promise<unknown>){waits.push(p);}};
 const send=(slug:string,tx="tx001")=>receiveWebhook(new Request("https://atpconcursos.example/api/webhooks/infinitepay",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({order_nsu:orderId,transaction_nsu:tx,invoice_slug:slug})}),env,ctx);
 const count=(table:string)=>Number((sqlite.prepare("SELECT COUNT(*) n FROM "+table).get() as {n:number}).n);
 return {sqlite,env,ctx,waits,send,count};
}
test("duplicate webhook deliveries create one durable event, without granting payment",async()=>{
 const f=fixture();
 try{
  for(let i=0;i<18;i++){
   const response=await f.send("invoice-abcd");
   assert.equal(response.status,200);
  }
  await Promise.all(f.waits);
  assert.equal(f.count("payment_events"),1);
  assert.equal((f.sqlite.prepare("SELECT status FROM orders WHERE id=?").get(orderId) as {status:string}).status,"pending");
  assert.equal((f.sqlite.prepare("SELECT status FROM payment_events").get() as {status:string}).status,"received:invoice-abcd");
  const other=await f.send("invoice-new");
  await Promise.all(f.waits);
  assert.equal(other.status,200);
  assert.equal(f.count("payment_events"),2,"a genuinely different invoice slug must not be blocked");
 }finally{f.sqlite.close();}
});
test("reconciliation rotates fairly across old and new payment events",async()=>{
 const f=fixture();
 try{
  for(let i=0;i<24;i++){
   const id=String(i).padStart(2,"0");
   f.sqlite.prepare("INSERT INTO payment_events(id,order_id,transaction_nsu,status,created_at) VALUES(?,?,?,?,?)")
    .run("event-"+id,orderId,"tx-"+id,"received:invoice-"+id,"2026-10-30 00:00:00");
  }
  await reconcile(f.env);
  assert.equal(f.count("payment_event_retries"),10);
  await reconcile(f.env);
  assert.equal(f.count("payment_event_retries"),20,"older repeatedly failing events cannot starve new events");
  await reconcile(f.env);
  assert.equal(f.count("payment_event_retries"),24);
  const attempts=f.sqlite.prepare("SELECT MIN(attempts) mn,MAX(attempts) mx FROM payment_event_retries").get() as {mn:number;mx:number};
  assert.equal(attempts.mn,1);
  assert.equal(attempts.mx,2);
  assert.equal((f.sqlite.prepare("SELECT status FROM orders WHERE id=?").get(orderId) as {status:string}).status,"pending");
 }finally{f.sqlite.close();}
});

test("webhook marks an event reconciled only after server-side amount verification",async()=>{
 const f=fixture();
 const original=globalThis.fetch;
 let checks=0;
 f.env.INFINITEPAY_HANDLE="sandbox-test-handle";
 globalThis.fetch=async(url)=>{
  assert.equal(String(url),"https://api.checkout.infinitepay.io/payment_check");
  checks++;
  return new Response(JSON.stringify({success:true,paid:true,amount:3700}),{status:200,headers:{"content-type":"application/json"}});
 };
 try {
  assert.equal((await f.send("legitimate-invoice","confirmed-tx")).status,200);
  await Promise.all(f.waits);
  assert.equal(checks,1);
  assert.equal((f.sqlite.prepare("SELECT status FROM orders WHERE id=?").get(orderId) as {status:string}).status,"paid");
  assert.equal((f.sqlite.prepare("SELECT status FROM payment_events").get() as {status:string}).status,"reconciled");
  assert.equal(f.count("payment_events"),1);
 }finally{globalThis.fetch=original;f.sqlite.close();}
});

test("provider payment mismatch keeps the order pending and event retryable",async()=>{
 const f=fixture();
 const original=globalThis.fetch;
 f.env.INFINITEPAY_HANDLE="sandbox-test-handle";
 globalThis.fetch=async()=>new Response(JSON.stringify({success:true,paid:true,amount:1}),{status:200,headers:{"content-type":"application/json"}});
 try{
  assert.equal((await f.send("wrong-amount","wrong-tx")).status,200);
  await Promise.all(f.waits);
  assert.equal((f.sqlite.prepare("SELECT status FROM orders WHERE id=?").get(orderId) as {status:string}).status,"pending");
  assert.equal((f.sqlite.prepare("SELECT status FROM payment_events").get() as {status:string}).status,"received:wrong-amount");
  assert.equal(f.count("sale_alerts"),0);
 }finally{globalThis.fetch=original;f.sqlite.close();}
});

