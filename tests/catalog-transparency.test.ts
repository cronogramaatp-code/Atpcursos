import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { listPublishedProducts, getPublishedProduct } from "../src/catalog";
import app from "../src/index";
import { clientJS } from "../src/client";
import { adminProducts } from "../src/admin";

function setup() {
 const db=new DatabaseSync(":memory:");
 for(const migration of ["0001_initial.sql","0002_courtesies_accounts.sql","0003_login_throttle.sql","0004_sale_alerts.sql","0005_multi_pdf_bundles.sql","0006_admin_pin.sql","0007_customer_order_ownership.sql"])
  db.exec(readFileSync(new URL("../migrations/"+migration,import.meta.url),"utf8"));
 const p1="11111111-1111-4111-8111-111111111111";
 const p2="22222222-2222-4222-8222-222222222222";
 const p3="33333333-3333-4333-8333-333333333333";
 const add=(id:string,slug:string,status:string,legacyPages:number)=>db.prepare("INSERT INTO products(id,slug,title,category,description,price_cents,status,page_count) VALUES(?,?,?,?,?,?,?,?)")
  .run(id,slug,slug,"Combos","PDFs de estudo",3700,status,legacyPages);
 add(p1,"combo-sem-contagem","published",0);
 add(p2,"combo-com-contagem","published",2);
 add(p3,"combo-oculto","draft",0);
 for(let i=0;i<8;i++)
  db.prepare("INSERT INTO product_files(id,product_id,title,original_key,page_count,size_bytes,position) VALUES(?,?,?,?,?,?,?)")
   .run("a"+i,p1,"Simulado "+(i+1),"originals/private-"+i+".pdf",i===3?0:10,1536,i);
 for(let i=0;i<2;i++)
  db.prepare("INSERT INTO product_files(id,product_id,title,original_key,page_count,size_bytes,position) VALUES(?,?,?,?,?,?,?)")
   .run("b"+i,p2,"PDF "+(i+1),"originals/private-known-"+i+".pdf",i+1,1536,i);
 const env:any={
  PDFS:{},
  DB:{prepare(sql:string){
   const statement=db.prepare(sql);
   return {bind(...args:any[]){return {async first(){return statement.get(...args);},async all(){return {results:statement.all(...args)}}};},
    async all(){return {results:statement.all()}},
    async first(){return statement.get()}};
  }}
 };
 return {db,env,p1,p2,p3};
}

test("public list shows exact PDF count but never falsely advertises zero pages",async()=>{
 const {db,env}=setup();
 try {
  const res=await listPublishedProducts(env);
  assert.equal(res.status,200);
  const data=await res.json() as any;
  assert.equal(data.products.length,2);
  const unknown=data.products.find((p:any)=>p.slug==="combo-sem-contagem");
  assert.equal(unknown.file_count,8);
  assert.equal(unknown.page_count,null);
  const known=data.products.find((p:any)=>p.slug==="combo-com-contagem");
  assert.equal(known.file_count,2);
  assert.equal(known.page_count,3);
  assert.ok(!JSON.stringify(data).includes("combo-oculto"));
  assert.ok(!JSON.stringify(data).includes("originals/"));
 }finally{db.close();}
});

test("product detail names all included files in order and hides private R2 paths",async()=>{
 const {db,env}=setup();
 try {
  const r=await getPublishedProduct(env,"combo-sem-contagem");
  assert.equal(r.status,200);
  const data=await r.json() as any;
  assert.equal(data.product.file_count,8);
  assert.equal(data.product.page_count,null);
  assert.deepEqual(data.files.map((f:any)=>f.title),Array.from({length:8},(_,i)=>"Simulado "+(i+1)));
  assert.equal(data.files[3].page_count,null);
  assert.ok(!JSON.stringify(data).includes("originals/"));
  assert.equal((await getPublishedProduct(env,"combo-oculto")).status,404);
 }finally{db.close();}
});


test("actual Worker catalog routes return public metadata, not R2 object names",async()=>{
 const {db,env}=setup();
 try {
  const list=await app.fetch(new Request("https://atpconcursos.example/api/products"),env,{} as any);
  assert.equal(list.status,200);
  const page=await app.fetch(new Request("https://atpconcursos.example/api/products/combo-sem-contagem"),env,{} as any);
  assert.equal(page.status,200);
  const data=await page.json() as any;
  assert.equal(data.product.file_count,8);
  assert.equal(data.files.length,8);
  assert.ok(!JSON.stringify(data).includes("originals/"));
 }finally{db.close();}
});

test("browser catalog renders file count and only reports verified page totals",()=>{
 assert.match(clientJS,/p\.file_count/);
 assert.match(clientJS,/d\.files/);
 assert.match(clientJS,/contagem de páginas em revisão/);
 assert.match(clientJS,/p\.page_count\?/);
 assert.doesNotThrow(()=>new Function(clientJS));
});


test("admin catalog reads PDF counts from linked files, not old product metadata",async()=>{
 const {db,env}=setup();
 try{
  const res=await adminProducts(new Request("https://atpconcursos.example/api/admin/products"),env);
  assert.equal(res.status,200);
  const data=await res.json() as any;
  const unknown=data.products.find((p:any)=>p.slug==="combo-sem-contagem");
  const known=data.products.find((p:any)=>p.slug==="combo-com-contagem");
  assert.equal(unknown.file_count,8);
  assert.equal(unknown.page_count,null);
  assert.equal(known.file_count,2);
  assert.equal(known.page_count,3);
 }finally{db.close();}
});
