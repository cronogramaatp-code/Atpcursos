import { Env, json,plain,html,readJSON,adminIdentity,originOK } from "./infra";
import { storefront,productPage,myMaterials,adminPage,adminImport } from "./ui";
import { clientJS } from "./client";
import { quote,createCheckout,receiveWebhook,reconcile } from "./checkout";
import { getDownload } from "./fulfillment";
import { overview,adminProducts,uploadPDF,publishProduct,presence } from "./admin";
async function route(req:Request,env:Env,ctx:ExecutionContext):Promise<Response>{
 const url=new URL(req.url),p=url.pathname,method=req.method;
 if(p==="/app.js"&&method==="GET")return new Response(clientJS,{headers:{"content-type":"application/javascript; charset=utf-8","cache-control":"public, max-age=300","x-content-type-options":"nosniff"}});
 if(p==="/health")return json({service:"atpcursos",stage:env.ENVIRONMENT||"staging",ready:!!env.DB&&!!env.PDFS});
 if((p==="/"||p==="/loja")&&method==="GET")return html(storefront());
 if(p==="/meus-materiais"&&method==="GET")return html(myMaterials());
 if(p.startsWith("/produto/")&&method==="GET")return html(productPage(decodeURIComponent(p.slice(9))));
 if(!env.DB||!env.PDFS)return json({error:"Banco e R2 ainda não configurados"},503);
 let adminEmail:string|null=null;
 if(p==="/adm"||p.startsWith("/adm/")||p.startsWith("/api/admin/")){
  if(!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD||!env.ADMIN_ALLOWED_EMAILS)
   return plain("Cloudflare Access ainda não configurado para o painel",503);
  adminEmail=await adminIdentity(req,env);
  if(!adminEmail)return plain("Acesso negado",403);
 }
 if((p==="/adm"||p==="/adm/")&&method==="GET")return html(adminPage());
 if(p==="/adm/produtos"&&method==="GET")return html(adminImport());
 if(["POST","PUT","PATCH","DELETE"].includes(method)&&p!=="/api/webhooks/infinitepay"&&!originOK(req))
  return json({error:"Origem não permitida"},403);
 if(p==="/api/products"&&method==="GET"){
  const data=await env.DB.prepare("SELECT id,slug,title,category,discipline,contest,description,price_cents,page_count FROM products WHERE status='published' ORDER BY created_at DESC LIMIT 100").all();
  return json({products:data.results});
 }
 if(p.startsWith("/api/products/")&&method==="GET"){
  const slug=decodeURIComponent(p.slice("/api/products/".length));
  const product=await env.DB.prepare("SELECT id,slug,title,category,discipline,contest,description,price_cents,page_count FROM products WHERE slug=? AND status='published'").bind(slug).first();
  return product?json({product}):json({error:"Produto não encontrado"},404);
 }
 if(p==="/api/recommendations"&&method==="GET"){
  const id=url.searchParams.get("product")||"";
  const product=await env.DB.prepare("SELECT contest,discipline FROM products WHERE id=? AND status='published'")
   .bind(id).first<{contest:string;discipline:string}>();
  if(!product)return json({products:[]});
  const r=await env.DB.prepare("SELECT id,slug,title,price_cents FROM products WHERE status='published' AND id<>? AND (contest=? OR discipline=?) ORDER BY updated_at DESC LIMIT 4")
   .bind(id,product.contest,product.discipline).all();
  return json({products:r.results});
 }
 if(p==="/api/quote"&&method==="POST"){
  const d=await readJSON(req),email=typeof d.email==="string"?d.email.trim().toLowerCase():"";
  const ids=Array.isArray(d.productIds)&&d.productIds.every(x=>typeof x==="string")?d.productIds as string[]:[];
  const data=await quote(env,email,ids);return json(data.pricing);
 }
 if(p==="/api/checkout"&&method==="POST"){
  if(env.ENVIRONMENT!=="production")return json({error:"Checkout real bloqueado no ambiente de homologação"},503);
  return createCheckout(req,env);
 }
 if(p==="/api/webhooks/infinitepay"&&method==="POST")return receiveWebhook(req,env,ctx);
 if(p==="/api/presence"&&method==="POST")return presence(req,env);
 if(p.startsWith("/api/download/")&&method==="GET")return getDownload(env,p.slice("/api/download/".length));
 if(p==="/api/admin/overview"&&method==="GET")return overview(env);
 if(p==="/api/admin/products"&&(method==="GET"||method==="POST"))return adminProducts(req,env);
 const up=p.match(/^\/api\/admin\/products\/([a-f0-9-]{36})\/upload$/i);
 if(up&&method==="PUT")return uploadPDF(req,env,up[1]);
 const pub=p.match(/^\/api\/admin\/products\/([a-f0-9-]{36})\/publish$/i);
 if(pub&&method==="POST")return publishProduct(env,pub[1],adminEmail||"");
 return json({error:"Rota não encontrada"},404);
}
export default {
 async fetch(req:Request,env:Env,ctx:ExecutionContext){
  try{return await route(req,env,ctx)}
  catch(err){
   const m=err instanceof Error?err.message:"unknown";
   if(["invalid order","product invalid","cart size invalid","invalid completedOrders"].includes(m))
    return json({error:"Dados do pedido inválidos"},422);
   if(m==="too large")return json({error:"Requisição excede limite"},413);
   if(m==="hash secret unavailable")return json({error:"Configuração de pagamentos pendente"},503);
   return json({error:"Falha temporária"},500);
  }
 },
 async scheduled(_event:ScheduledEvent,env:Env,_ctx:ExecutionContext){
  if(!env.DB)return;
  await reconcile(env);
  await env.DB.prepare("DELETE FROM presence WHERE last_seen_unix<?").bind(Math.floor(Date.now()/1000)-86400).run();
 }
};
