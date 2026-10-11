import { PDFDocument } from "pdf-lib";
import { Env,json,readJSON,moneyOK,uuid,sha256,now } from "./infra";
import { summarizeOrders } from "./domain/metrics";
export async function overview(env:Env){
 const paid=await env.DB.prepare("SELECT status,total_cents,discount_cents,created_at,paid_at FROM orders ORDER BY created_at DESC LIMIT 10000").all<{
  status:string;total_cents:number;discount_cents:number;created_at:string;paid_at:string|null
 }>();
 const metrics=summarizeOrders(paid.results,new Date().toISOString().slice(0,10));
 const online=await env.DB.prepare("SELECT COUNT(*) AS n FROM presence WHERE last_seen_unix>?").bind(now()-300).first<{n:number}>();
 const latest=await env.DB.prepare("SELECT id,status,total_cents,created_at FROM orders ORDER BY created_at DESC LIMIT 30").all();
 return json({metrics,online:online?.n||0,orders:latest.results,onlineDefinition:"Sessões anônimas com atividade nos últimos cinco minutos"});
}
const clean=(x:unknown,max:number)=>typeof x==="string"?x.trim().slice(0,max):"";
export async function adminProducts(req:Request,env:Env){
 if(req.method==="GET"){
  const r=await env.DB.prepare("SELECT id,slug,title,category,price_cents,status,page_count FROM products ORDER BY created_at DESC LIMIT 100").all();
  return json({products:r.results});
 }
 const d=await readJSON(req);
 const title=clean(d.title,141),category=clean(d.category,30),price=d.priceCents;
 if(title.length<3||title.length>140||!["Simulados","Mapas mentais","Resumões","Apostilas","Cronogramas","Combos"].includes(category)||!moneyOK(price))
  return json({error:"Revise os dados do produto"},422);
 const id=uuid();
 await env.DB.prepare("INSERT INTO products(id,slug,title,category,contest,discipline,description,price_cents) VALUES(?,?,?,?,?,?,?,?)")
  .bind(id,"material-"+id.slice(0,8),title,category,clean(d.contest,100),clean(d.discipline,100),clean(d.description,3000),price).run();
 return json({id,status:"draft"},201);
}
export async function uploadPDF(req:Request,env:Env,id:string){
 if(!req.headers.get("content-type")?.toLowerCase().startsWith("application/pdf"))
  return json({error:"Formato obrigatório: application/pdf"},415);
 const limit=15*1024*1024;
 const rawLength=req.headers.get("content-length");
 if(!rawLength||!Number.isSafeInteger(Number(rawLength))||Number(rawLength)>limit)
  return json({error:"PDF máximo de 15MB (Content-Length obrigatório)"},413);
 const product=await env.DB.prepare("SELECT status FROM products WHERE id=?").bind(id).first<{status:string}>();
 if(!product||product.status!=="draft")return json({error:"Produto não está em rascunho"},409);
 const buffer=await req.arrayBuffer();
 if(buffer.byteLength<24||buffer.byteLength>limit||new TextDecoder().decode(buffer.slice(0,5))!=="%PDF-")
  return json({error:"Arquivo inválido"},422);
 let pageCount:number;
 try{
  const pdf=await PDFDocument.load(buffer,{ignoreEncryption:false});
  pageCount=pdf.getPageCount();
  if(pageCount<1||pageCount>500)throw Error("size");
 }catch{return json({error:"PDF ilegível, criptografado ou excede 500 páginas"},422)}
 const hash=await sha256(Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",buffer))).join("."));
 const key="originals/"+id+"/"+uuid()+"-"+hash.slice(0,16)+".pdf";
 await env.PDFS.put(key,buffer,{httpMetadata:{contentType:"application/pdf"}});
 await env.DB.prepare("UPDATE products SET original_key=?,page_count=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='draft'")
  .bind(key,pageCount,id).run();
 return json({status:"draft",pages:pageCount},201);
}
export async function publishProduct(env:Env,id:string,adminEmail:string){
 const product=await env.DB.prepare("SELECT original_key,status FROM products WHERE id=?").bind(id).first<{original_key:string|null;status:string}>();
 if(!product||product.status!=="draft"||!product.original_key)
  return json({error:"Revise e importe o PDF antes de publicar"},409);
 if(!await env.PDFS.head(product.original_key))return json({error:"PDF original não encontrado"},409);
 await env.DB.prepare("UPDATE products SET status='published',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='draft'").bind(id).run();
 await env.DB.prepare("INSERT INTO audit_logs(id,action,actor,target) VALUES(?,?,?,?)").bind(uuid(),"publish_product",adminEmail,id).run();
 return json({status:"published"});
}
export async function presence(req:Request,env:Env){
 const d=await readJSON(req,256),session=clean(d.session,64);
 if(!/^[a-f0-9-]{36}$/i.test(session))return json({error:"Sessão inválida"},422);
 const hash=await sha256(session);
 await env.DB.prepare("INSERT INTO presence(session_hash,last_seen_unix) VALUES(?,?) ON CONFLICT(session_hash) DO UPDATE SET last_seen_unix=excluded.last_seen_unix")
  .bind(hash,now()).run();
 return json({ok:true});
}
