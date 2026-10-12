import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {appendProductPDF,productFiles,removeProductPDF,MAX_PDF_BYTES,MAX_PRODUCT_FILES,MAX_PRODUCT_BYTES,safeFileTitle,pdfEnvelopeOK} from "../src/product-files";

test("PDF bundle upload limits and sanitized labels",()=>{
 assert.equal(MAX_PDF_BYTES,50*1024*1024);
 assert.equal(MAX_PRODUCT_FILES,20);
 assert.equal(MAX_PRODUCT_BYTES,300*1024*1024);
 assert.equal(safeFileTitle('Simulado 01 / Gabarito<>.pdf'),"Simulado 01   Gabarito  .pdf");
 assert.equal(pdfEnvelopeOK("%PDF-1.7 abc","abc%%EOF\n"),true);
 assert.equal(pdfEnvelopeOK("notpdf","%%EOF"),false);
 assert.equal(pdfEnvelopeOK("%PDF-1.7","truncated"),false);
});

test("oversized PDF is rejected before touching R2 or D1",async()=>{
 const request=new Request("https://example.com/api/admin/products/11111111-1111-4111-8111-111111111111/upload",{
  method:"PUT",headers:{"content-type":"application/pdf","content-length":String(MAX_PDF_BYTES+1)},body:"%PDF-1.7\n%%EOF"
 });
 const response=await appendProductPDF(request,{} as any,"11111111-1111-4111-8111-111111111111");
 assert.equal(response.status,413);
});

test("multi-PDF draft can upload, list and remove independent originals",async()=>{
 const pdf=await PDFDocument.create();
 pdf.addPage([595,842]);
 const original=await pdf.save();
 const stored=new Map<string,Uint8Array>();
 const files:Array<{id:string;title:string;original_key:string;page_count:number;size_bytes:number;position:number}>=[];
 const db={
  prepare(sql:string){
   let args:any[]=[];
   const stmt={
    bind(...next:any[]){args=next;return stmt;},
    async first(){
     if(sql.includes("SELECT status FROM products"))return {status:"draft"};
     if(sql.includes("COUNT(*) AS n"))return {n:files.length,bytes:files.reduce((a,f)=>a+f.size_bytes,0)};
     if(sql.includes("SELECT original_key FROM product_files"))return files.find(f=>f.id===args[0])||null;
     throw Error("Unexpected first: "+sql);
    },
    async all(){
     if(sql.includes("FROM product_files"))return {results:files.filter(f=>f.id!==undefined).map(f=>({id:f.id,title:f.title,page_count:f.page_count,size_bytes:f.size_bytes,position:f.position}))};
     throw Error("Unexpected all: "+sql);
    },
    async run(){
     if(sql.includes("INSERT INTO product_files"))files.push({id:args[0],title:args[2],original_key:args[3],page_count:args[4],size_bytes:args[5],position:args[6]});
     if(sql.includes("DELETE FROM product_files"))files.splice(files.findIndex(f=>f.id===args[0]),1);
     return {meta:{changes:1}};
    }
   };
   return stmt;
  }
 };
 const bucket={
  async put(key:string,body:ReadableStream){const value=new Uint8Array(await new Response(body).arrayBuffer());stored.set(key,value);return {size:value.byteLength};},
  async get(key:string,opts?:{range?:{offset?:number;length?:number;suffix?:number}}){
   const body=stored.get(key);if(!body)return null;
   const bytes=opts?.range?.suffix?body.slice(-opts.range.suffix):opts?.range?.length?body.slice(opts.range.offset||0,(opts.range.offset||0)+opts.range.length):body;
   return {text:async()=>new TextDecoder().decode(bytes),arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
  },
  async delete(key:string){stored.delete(key);}
 };
 const env={DB:db,PDFS:bucket} as any;
 const productId="11111111-1111-4111-8111-111111111111";
 const upload=async(name:string)=>appendProductPDF(
  new Request("https://example.com/upload?name="+encodeURIComponent(name),{
   method:"PUT",headers:{"content-type":"application/pdf","content-length":String(original.byteLength)},body:original
  }),env,productId
 );
 assert.equal((await upload("Prova 01.pdf")).status,201);
 assert.equal((await upload("Gabarito 01.pdf")).status,201);
 const list=await (await productFiles(env,productId)).json() as {files:Array<{title:string}>};
 assert.deepEqual(list.files.map(x=>x.title),["Prova 01.pdf","Gabarito 01.pdf"]);
 assert.equal(stored.size,2);
 assert.equal((await removeProductPDF(env,productId,files[0].id)).status,200);
 assert.equal(stored.size,1);
 assert.equal(files.length,1);
});
