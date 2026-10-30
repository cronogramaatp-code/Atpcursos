import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { secretHash } from "../src/domain/customer";
import { emailHash } from "../src/infra";
import { myAccount, purchaseFileDownload } from "../src/customer-public";
import app from "../src/index";

const buyerId="22222222-2222-4222-8222-222222222222";
const buyerEmail="comprador@example.com";
const otherEmail="outro@example.com";
const secret="a".repeat(64);
const cookie="atp_customer_session="+secret;
const buyerKey="only-this-store-buyer-hash";

async function fixture(){
 const db=new DatabaseSync(":memory:");
 for(const migration of ["0001_initial.sql","0002_courtesies_accounts.sql","0003_login_throttle.sql","0004_sale_alerts.sql","0005_multi_pdf_bundles.sql"]){
   db.exec(readFileSync(new URL("../migrations/"+migration,import.meta.url),"utf8"));
 }
 db.prepare("INSERT INTO customers(id,full_name,email,email_hash) VALUES(?,?,?,?)").run(buyerId,"Comprador Teste",buyerEmail,await emailHash(buyerEmail,buyerKey));
 db.prepare("INSERT INTO customer_sessions(token_hash,customer_id,expires_at) VALUES(?,?,?)").run(await secretHash(secret),buyerId,2100000000);
 db.prepare("INSERT INTO products(id,slug,title,category,price_cents,status) VALUES(?,?,?,?,?,?)").run("11111111-1111-4111-8111-111111111111","pacote","Pacote","Simulados",3700,"published");
 const productId="11111111-1111-4111-8111-111111111111";
 const orders=[
  ["33333333-3333-4333-8333-333333333333",buyerEmail,"delivered","44444444-4444-4444-8444-444444444444","55555555-5555-4555-8555-555555555555","66666666-6666-4666-8666-666666666666"],
  ["73333333-3333-4333-8333-333333333333",otherEmail,"delivered","74444444-4444-4444-8444-444444444444","75555555-5555-4555-8555-555555555555","76666666-6666-4666-8666-666666666666"],
  ["83333333-3333-4333-8333-333333333333",buyerEmail,"refunded","84444444-4444-4444-8444-444444444444","85555555-5555-4555-8555-555555555555","86666666-6666-4666-8666-666666666666"]
 ] as const;
 for(const [order,email,status,item,file,delivery] of orders){
  db.prepare("INSERT INTO orders(id,buyer_name,buyer_email,buyer_email_hash,status,total_cents,full_cents,provider_order_nsu) VALUES(?,?,?,?,?,?,?,?)")
    .run(order,"Teste",email,await emailHash(email,buyerKey),status,3700,3700,order);
  db.prepare("INSERT INTO order_items(id,order_id,product_id,title_snapshot,price_snapshot_cents,original_key_snapshot) VALUES(?,?,?,?,?,?)")
    .run(item,order,productId,"Pacote de concurso",3700,"originals/test.pdf");
  db.prepare("INSERT INTO order_item_files(id,order_item_id,title_snapshot,original_key_snapshot,position) VALUES(?,?,?,?,?)")
    .run(file,item,"Simulado 1","originals/"+file+".pdf",0);
  db.prepare("INSERT INTO bundle_deliveries(id,order_item_file_id,order_id,status,personalized_key) VALUES(?,?,?,?,?)")
    .run(delivery,file,order,"sent","personalized-bundles/"+order+"/"+delivery+".pdf");
 }
 const prep=(sql:string)=>{
  const statement=db.prepare(sql);
  const obj={
   bind(...values:unknown[]){return {
    async first(){return statement.get(...(values as any[]));},
    async all(){return {results:statement.all(...(values as any[]))}}
   }}
  };
  return obj;
 };
 const keys=orders.map(x=>"personalized-bundles/"+x[0]+"/"+x[5]+".pdf");
 const env:any={DB:{prepare:prep},PDFS:{async get(key:string){return keys.includes(key)?{body:new Blob(["%PDF-1.7 TEST"]).stream()}:null;}},BUYER_HASH_KEY:buyerKey};
 const request=(path:string,authenticated=true)=>new Request("https://atpconcursos.example"+path,{headers:authenticated?{cookie}:{}});
 return {db,env,request,orders};
}

test("my account lists own paid materials and not purchases from another customer",async()=>{
 const f=await fixture();
 try {
  const result=await myAccount(f.request("/api/customer/me"),f.env);
  assert.equal(result.status,200);
  const data=await result.json() as any;
  assert.equal(data.customer.email,buyerEmail);
  assert.equal(data.purchases.length,2);
  const paid=data.purchases.find((p:any)=>p.status==="delivered");
  assert.ok(paid);
  assert.equal(paid.files[0].title,"Simulado 1");
  assert.equal(paid.files[0].downloadable,true);
  const refunded=data.purchases.find((p:any)=>p.status==="refunded");
  assert.equal(refunded.files[0].downloadable,false);
  assert.ok(!JSON.stringify(data).includes(otherEmail));
  assert.ok(!JSON.stringify(data).includes("personalized-bundles/"));
 }finally{f.db.close();}
});

test("authenticated download is scoped to paid order and refuses other buyers/refunds",async()=>{
 const f=await fixture();
 try {
  const paid=f.orders[0][5],other=f.orders[1][5],refunded=f.orders[2][5];
  const route=(id:string)=>"/api/customer/purchases/bundle/"+id+"/download";
  const own=await purchaseFileDownload(f.request(route(paid)),f.env,"bundle",paid);
  assert.equal(own.status,200);
  assert.equal(own.headers.get("cache-control"),"private, no-store");
  assert.match(own.headers.get("content-disposition")??"",/attachment/);
  const unauth=await purchaseFileDownload(f.request(route(paid),false),f.env,"bundle",paid);
  assert.equal(unauth.status,401);
  const stolen=await purchaseFileDownload(f.request(route(other)),f.env,"bundle",other);
  assert.equal(stolen.status,403);
  const invalidRefund=await purchaseFileDownload(f.request(route(refunded)),f.env,"bundle",refunded);
  assert.equal(invalidRefund.status,403);
  assert.equal((await purchaseFileDownload(f.request(route("not-an-id")),f.env,"bundle","not-an-id")).status,403);
 }finally{f.db.close();}
});

test("missing buyer hash configuration fails closed",async()=>{
 const f=await fixture();
 try{
  delete f.env.BUYER_HASH_KEY;
  assert.equal((await myAccount(f.request("/api/customer/me"),f.env)).status,503);
  assert.equal((await purchaseFileDownload(f.request("/x"),f.env,"bundle",f.orders[0][5])).status,503);
 }finally{f.db.close();}
});
test("legacy single-file downloads require the same owner checks",async()=>{
 const f=await fixture();
 try {
  const order="93333333-3333-4333-8333-333333333333";
  const item="94444444-4444-4444-8444-444444444444";
  const delivery="95555555-5555-4555-8555-555555555555";
  const hash=await emailHash(buyerEmail,buyerKey);
  f.db.prepare("INSERT INTO orders(id,buyer_name,buyer_email,buyer_email_hash,status,total_cents,full_cents,provider_order_nsu) VALUES(?,?,?,?,?,?,?,?)")
   .run(order,"Teste",buyerEmail,hash,"delivered",3700,3700,order);
  f.db.prepare("INSERT INTO order_items(id,order_id,product_id,title_snapshot,price_snapshot_cents,original_key_snapshot) VALUES(?,?,?,?,?,?)")
   .run(item,order,"11111111-1111-4111-8111-111111111111","Apostila legada",3700,"originals/legacy.pdf");
  f.db.prepare("INSERT INTO deliveries(id,order_item_id,order_id,status,personalized_key) VALUES(?,?,?,?,?)")
   .run(delivery,item,order,"sent","personalized/"+order+"/"+item+".pdf");
  f.env.PDFS.get=async (key:string)=>key==="personalized/"+order+"/"+item+".pdf"?{body:new Blob(["%PDF-1.7 TEST"]).stream()}:null;
  const own=await purchaseFileDownload(f.request("/api/customer/purchases/legacy/"+delivery+"/download"),f.env,"legacy",delivery);
  assert.equal(own.status,200);
  f.db.prepare("UPDATE deliveries SET status='revoked' WHERE id=?").run(delivery);
  assert.equal((await purchaseFileDownload(f.request("/x"),f.env,"legacy",delivery)).status,403);
 }finally{f.db.close();}
});
test("worker routes enforce purchase ownership on actual HTTP endpoints",async()=>{
 const f=await fixture();
 try{
  const own=f.orders[0][5], other=f.orders[1][5];
  const url="/api/customer/purchases/bundle/"+own+"/download";
  const granted=await app.fetch(f.request(url),f.env,{} as any);
  assert.equal(granted.status,200);
  assert.equal((await app.fetch(f.request(url,false),f.env,{} as any)).status,401);
  assert.equal((await app.fetch(f.request("/api/customer/purchases/bundle/"+other+"/download"),f.env,{} as any)).status,403);
  const html=await app.fetch(f.request("/meus-materiais",false),f.env,{} as any);
  assert.equal(html.status,200);
  assert.match(await html.text(),/Minhas compras/);
 }finally{f.db.close();}
});
