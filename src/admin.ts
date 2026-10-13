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
  const schema=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='product_files'").first();
  const q=schema
   ?"SELECT id,slug,title,category,price_cents,status,page_count,(SELECT COUNT(*) FROM product_files f WHERE f.product_id=products.id) AS file_count FROM products ORDER BY created_at DESC LIMIT 100"
   :"SELECT id,slug,title,category,price_cents,status,page_count,CASE WHEN original_key IS NULL THEN 0 ELSE 1 END AS file_count FROM products ORDER BY created_at DESC LIMIT 100";
  const r=await env.DB.prepare(q).all();
  return json({products:r.results,multiPdfReady:!!schema});
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
export async function publishProduct(env:Env,id:string,adminEmail:string){
 const schema=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'product_files\'").first();
 if(!schema)return json({error:"Atualização do banco ainda não aplicada neste ambiente"},503);
 const product=await env.DB.prepare("SELECT status FROM products WHERE id=?").bind(id).first<{status:string}>();
 if(!product||product.status!=="draft")return json({error:"Produto não está em rascunho"},409);
 const files=await env.DB.prepare("SELECT original_key FROM product_files WHERE product_id=? ORDER BY position,created_at,id LIMIT 21")
  .bind(id).all<{original_key:string}>();
 if(!files.results.length||files.results.length>20)
  return json({error:"Adicione de 1 a 20 PDFs antes de publicar"},409);
 for(const f of files.results)if(!await env.PDFS.head(f.original_key))
  return json({error:"Um PDF do produto está ausente do armazenamento privado"},409);
 const r=await env.DB.prepare("UPDATE products SET status='published',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='draft'").bind(id).run();
 if((r.meta?.changes||0)!==1)return json({error:"Produto alterado durante a publicação"},409);
 await env.DB.prepare("INSERT INTO audit_logs(id,action,actor,target) VALUES(?,?,?,?)")
  .bind(uuid(),"publish_product",adminEmail,id).run();
 return json({status:"published",fileCount:files.results.length});
}
export async function presence(req:Request,env:Env){
 const d=await readJSON(req,256),session=clean(d.session,64);
 if(!/^[a-f0-9-]{36}$/i.test(session))return json({error:"Sessão inválida"},422);
 const hash=await sha256(session);
 await env.DB.prepare("INSERT INTO presence(session_hash,last_seen_unix) VALUES(?,?) ON CONFLICT(session_hash) DO UPDATE SET last_seen_unix=excluded.last_seen_unix")
  .bind(hash,now()).run();
 return json({ok:true});
}
