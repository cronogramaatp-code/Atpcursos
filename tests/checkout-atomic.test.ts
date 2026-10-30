import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { createCheckout } from "../src/checkout";

const productId="11111111-1111-4111-8111-111111111111";
function setup(fileCount=8, breakInsert=false){
 const sqlite=new DatabaseSync(":memory:");
 sqlite.exec(readFileSync(new URL("../migrations/0001_initial.sql",import.meta.url),"utf8"));
 sqlite.exec(readFileSync(new URL("../migrations/0005_multi_pdf_bundles.sql",import.meta.url),"utf8"));
 sqlite.prepare("INSERT INTO products(id,slug,title,category,price_cents,status) VALUES(?,?,?,?,?,?)")
 .run(productId,"combo-8","Combo de oito arquivos","Combos",3700,"published");
 for(let i=0;i<fileCount;i++)
  sqlite.prepare("INSERT INTO product_files(id,product_id,title,original_key,position) VALUES(?,?,?,?,?)")
   .run(String(i),productId,"Arquivo "+i,"originals/"+i+".pdf",i);
 if(breakInsert)sqlite.exec("CREATE TRIGGER block_file BEFORE INSERT ON order_item_files BEGIN SELECT RAISE(ABORT,'forced test failure'); END;");
 let batches=0;
 function prepare(sql:string){
  const s=sqlite.prepare(sql);let args:any[]=[];
  const x={
   bind(...next:any[]){args=next;return x;},
   async run(){const r=s.run(...args);return {meta:{changes:r.changes}};},
   async first(){return s.get(...args);},
   async all(){return {results:s.all(...args)};}
  };
  return x;
 }
 const env:any={
  DB:{
   prepare,
   async batch(statements:any[]){
    batches++;
    sqlite.exec("BEGIN");
    try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec("COMMIT");return results;}
    catch(e){sqlite.exec("ROLLBACK");throw e;}
   }
  },
  CHECKOUT_ENABLED:"true",INFINITEPAY_HANDLE:"test-shop",BUYER_HASH_KEY:"test-shop-only-buyer-hmac",
  PUBLIC_BASE_URL:"https://atpconcursos.example",ENVIRONMENT:"production"
 };
 const request=()=>new Request("https://atpconcursos.example/api/checkout",{
  method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
   name:"Estudante de Teste",email:"teste@example.com",productIds:[productId]
  })
 });
 const count=(table:string)=>Number((sqlite.prepare("SELECT COUNT(*) n FROM "+table).get() as {n:number}).n);
 return {sqlite,env,request,count,batches:()=>batches};
}

test("checkout persists a complete eight-file bundle in one D1 transaction",async()=>{
 const {sqlite,env,request,count,batches}=setup();
 const original=globalThis.fetch;
 let calls=0;
 globalThis.fetch=async(_url,options)=>{calls++;const body=JSON.parse(String(options?.body)) as {order_nsu:string};assert.match(body.order_nsu,/^[a-f0-9-]{36}$/);return new Response(JSON.stringify({url:"https://checkout.infinitepay.com.br/checkout/test"}),{status:200,headers:{"content-type":"application/json"}});};
 try{
  const r=await createCheckout(request(),env);
  assert.equal(r.status,200);
  assert.equal(batches(),1,"all order, item, and file records must be one atomic D1 batch");
  assert.equal(calls,1);
  assert.equal(count("orders"),1);
  assert.equal(count("order_items"),1);
  assert.equal(count("order_item_files"),8);
  const snapshots=sqlite.prepare("SELECT original_key_snapshot,position FROM order_item_files ORDER BY position").all() as Array<{original_key_snapshot:string;position:number}>;
  assert.deepEqual(snapshots.map(x=>x.original_key_snapshot),Array.from({length:8},(_,i)=>"originals/"+i+".pdf"));
 }finally{globalThis.fetch=original;sqlite.close();}
});

test("failure writing one bundle item rolls back order and never creates payment",async()=>{
 const {sqlite,env,request,count,batches}=setup(8,true);
 const original=globalThis.fetch;
 let called=false;
 globalThis.fetch=async()=>{called=true;throw Error("provider must not be called")};
 try{
  await assert.rejects(()=>createCheckout(request(),env),/forced test failure/);
  assert.equal(batches(),1);
  assert.equal(count("orders"),0);
  assert.equal(count("order_items"),0);
  assert.equal(count("order_item_files"),0);
  assert.equal(called,false);
 }finally{globalThis.fetch=original;sqlite.close();}
});

test("checkout fails without any valid bundle file before inserting a partial order",async()=>{
 const {sqlite,env,request,count}=setup(0);
 try{
  await assert.rejects(()=>createCheckout(request(),env),/invalid order|product invalid/);
  assert.equal(count("orders"),0);
 }finally{sqlite.close();}
});
