import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { publishProduct } from "../src/admin";

const migrations=["0001_initial.sql","0002_courtesies_accounts.sql","0003_login_throttle.sql","0004_sale_alerts.sql","0005_multi_pdf_bundles.sql","0006_admin_pin.sql","0007_customer_order_ownership.sql","0008_product_publication_guards.sql"];
const id="11111111-1111-4111-8111-111111111111";
function makeDb(){
 const db=new DatabaseSync(":memory:");
 db.exec("PRAGMA foreign_keys=ON");
 for(const name of migrations)db.exec(readFileSync(join("migrations",name),"utf8"));
 return db;
}
function product(db:DatabaseSync,status="draft",pid=id){
 db.prepare("INSERT INTO products(id,slug,title,category,price_cents,status) VALUES(?,?,?,?,?,?)")
 .run(pid,"material-"+pid,"Combo integral","Combos",3700,status);
}
function file(db:DatabaseSync,number:number,pid=id,size=1024){
 db.prepare("INSERT INTO product_files(id,product_id,title,original_key,page_count,size_bytes,position) VALUES(?,?,?,?,?,?,?)")
 .run(pid+"-"+number,pid,"PDF "+number,"originals/"+pid+"/"+number+".pdf",3,size,number);
}
test("a published bundle cannot lose or change any of its linked PDF originals",()=>{
 const db=makeDb();
 try{
  product(db);file(db,0);file(db,1);
  db.prepare("UPDATE products SET status='published' WHERE id=?").run(id);
  assert.throws(()=>file(db,2),/draft|published|immutable/i);
  assert.throws(()=>db.prepare("DELETE FROM product_files WHERE product_id=?").run(id),/draft|published|immutable/i);
  assert.throws(()=>db.prepare("UPDATE product_files SET original_key=? WHERE product_id=?").run("originals/hijacked.pdf",id),/draft|published|immutable/i);
  assert.equal((db.prepare("SELECT COUNT(*) n FROM product_files WHERE product_id=?").get(id) as {n:number}).n,2);
 }finally{db.close();}
});
test("publishing an empty product is rejected at the database boundary",()=>{
 const db=makeDb();try{product(db);assert.throws(()=>db.prepare("UPDATE products SET status='published' WHERE id=?").run(id),/PDF|file|empty|publish/i)}finally{db.close();}
});
test("database limits product bundles to 20 files and 300 MB regardless of concurrent requests",()=>{
 const db=makeDb();
 try{
  product(db);
  for(let i=0;i<20;i++)file(db,i);
  assert.throws(()=>file(db,20),/limit|20/i);
  const other="22222222-2222-4222-8222-222222222222";
  product(db,"draft",other);
  for(let i=0;i<6;i++)file(db,i,other,50*1024*1024);
  assert.throws(()=>file(db,6,other,1),/300|limit|size/i);
 }finally{db.close();}
});
test("migration is idempotent and preserves existing published bundles without rewriting their data",()=>{
 const db=new DatabaseSync(":memory:");
 try{
  db.exec("PRAGMA foreign_keys=ON");
  for(const name of migrations.slice(0,-1))db.exec(readFileSync(join("migrations",name),"utf8"));
  product(db);file(db,0);
  db.prepare("UPDATE products SET status='published' WHERE id=?").run(id);
  const latest=readFileSync(join("migrations","0008_product_publication_guards.sql"),"utf8");
  db.exec(latest);db.exec(latest);
  assert.equal((db.prepare("SELECT status FROM products WHERE id=?").get(id) as {status:string}).status,"published");
  assert.throws(()=>db.prepare("DELETE FROM product_files WHERE product_id=?").run(id),/draft|published|immutable/i);
 }finally{db.close();}
});
test("publication fails closed when a PDF is removed during R2 preflight",async()=>{
 const db=makeDb();
 try{
  product(db);file(db,0);file(db,1);
  let checked=0;
  const env:any={
   DB:{
    prepare(sql:string){
     const statement=db.prepare(sql);
     return {async first(){return statement.get();},bind(...values:any[]){return {
      async first(){return statement.get(...values);},
      async all(){return {results:statement.all(...values)};},
      async run(){const out=statement.run(...values);return {meta:{changes:out.changes}};}
     }}};
    }
   },
   PDFS:{
    async head(_key:string){
     checked++;
     if(checked===1)db.prepare("DELETE FROM product_files WHERE id=?").run(id+"-1");
     return {size:1024};
    }
   }
  };
  const response=await publishProduct(env,id,"qa@atpconcursos.example");
  assert.equal(response.status,409,"must reject publishing a different file set than preflight approved");
  assert.equal((db.prepare("SELECT status FROM products WHERE id=?").get(id) as {status:string}).status,"draft");
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM product_files WHERE product_id=?").get(id) as {n:number}).n,1);
 }finally{db.close();}
});

