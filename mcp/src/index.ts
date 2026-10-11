import { jwtVerify, createRemoteJWKSet } from "jose";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";
import { registerDeveloperTools } from "./developer-tools";

interface Env {
 DB: D1Database; PDFS: R2Bucket;
 ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string; ADMIN_ALLOWED_EMAILS?: string;
 ENVIRONMENT?: string; GITHUB_TOKEN?: string; ALLOW_PRODUCTION_DEPLOY?: string; PRODUCTION_PROJECT_READY?: string;
}
const output=(value:unknown)=>({content:[{type:"text" as const,text:JSON.stringify(value)}]});
const failure=(reason:string)=>({content:[{type:"text" as const,text:reason}],isError:true});
const uuid=()=>crypto.randomUUID();
async function authenticate(req:Request,env:Env):Promise<string|null>{
 if(!env.ACCESS_AUD||!env.ACCESS_TEAM_DOMAIN||!env.ADMIN_ALLOWED_EMAILS)return null;
 const issuer=env.ACCESS_TEAM_DOMAIN.replace(/\/$/,"");
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer))return null;
 const token=req.headers.get("CF-Access-Jwt-Assertion");if(!token)return null;
 try{
  const keys=createRemoteJWKSet(new URL(issuer+"/cdn-cgi/access/certs"));
  const {payload}=await jwtVerify(token,keys,{issuer,audience:env.ACCESS_AUD,algorithms:["RS256"]});
  const identity=typeof payload.email==="string"?payload.email.toLowerCase():"";
  const allowed=env.ADMIN_ALLOWED_EMAILS.split(",").map(v=>v.trim().toLowerCase());
  return identity&&allowed.includes(identity)?identity:null;
 }catch{return null}
}
function makeServer(env:Env,actor:string){
 const s=new McpServer({name:"ATPCursos Admin & Developer",version:"0.1.0"});
 s.registerTool("platform_status",{description:"Diagnóstico somente leitura da infraestrutura ATPCursos",inputSchema:{}},async()=>{
  try{
   const row=await env.DB.prepare("SELECT 1 AS ok").first<{ok:number}>();
   return output({stage:env.ENVIRONMENT||"staging",d1:row?.ok===1,r2:!!env.PDFS,mcp:"OAuth Access / owner verified",scope:"ATPCursos only"});
  }catch{return failure("Banco ATPCursos indisponível")}
 });
 s.registerTool("sales_dashboard",{description:"Receitas, pedidos, descontos, reembolsos e compradores online",inputSchema:{}},async()=>{
  try{
   const d=await env.DB.prepare("SELECT COUNT(*) AS orders,SUM(CASE WHEN status IN ('paid','delivered') THEN 1 ELSE 0 END) AS paid_orders,SUM(CASE WHEN status IN ('paid','delivered') THEN total_cents ELSE 0 END) AS net_cents,SUM(CASE WHEN status='refunded' THEN total_cents ELSE 0 END) AS refunded_cents,SUM(CASE WHEN status IN ('paid','delivered') THEN discount_cents ELSE 0 END) AS discount_cents FROM orders").first();
   const online=await env.DB.prepare("SELECT COUNT(*) AS active FROM presence WHERE last_seen_unix>?").bind(Math.floor(Date.now()/1000)-300).first();
   return output({metrics:d,online,online_window_seconds:300,data_source:"D1 actual confirmed orders"});
  }catch{return failure("Dashboard indisponível")}
 });
 s.registerTool("products_list",{description:"Listar produtos, preços e status de publicação",inputSchema:{limit:z.number().int().min(1).max(100).default(30)}},async({limit})=>{
  try{
   const q=await env.DB.prepare("SELECT id,slug,title,category,contest,discipline,price_cents,status,page_count FROM products ORDER BY created_at DESC LIMIT ?").bind(limit).all();
   return output({products:q.results});
  }catch{return failure("Falha ao consultar catálogo")}
 });
 s.registerTool("orders_search",{description:"Pesquisar pedidos; contém dados do comprador. Apenas owner autenticado.",inputSchema:{status:z.enum(["pending","paid","delivered","refunded","checkout_failed"]).optional(),limit:z.number().int().min(1).max(50).default(15)}},async({status,limit})=>{
  try{
   const q=status?env.DB.prepare("SELECT id,buyer_name,buyer_email,status,total_cents,discount_rate,paid_at FROM orders WHERE status=? ORDER BY created_at DESC LIMIT ?").bind(status,limit):env.DB.prepare("SELECT id,buyer_name,buyer_email,status,total_cents,discount_rate,paid_at FROM orders ORDER BY created_at DESC LIMIT ?").bind(limit);
   const r=await q.all();return output({orders:r.results});
  }catch{return failure("Consulta de pedidos indisponível")}
 });
 s.registerTool("discount_policy_get",{description:"Política automática não cumulativa de descontos",inputSchema:{}},async()=>
  output({second_purchase_percent:20,third:30,fourth:40,fifth_plus:50,first_cart_with_multiple_products_percent:10,stack:false,cap_percent:50}));
 s.registerTool("products_create",{description:"Cadastrar novo material rascunho; o PDF é importado pelo admin",inputSchema:{title:z.string().min(3).max(140),category:z.enum(["Simulados","Mapas mentais","Resumões","Apostilas","Cronogramas","Combos"]),price_cents:z.number().int().min(100).max(20000000)}},async({title,category,price_cents})=>{
  try{
   const id=uuid();await env.DB.prepare("INSERT INTO products(id,slug,title,category,price_cents,status) VALUES(?,?,?,?,?,'draft')").bind(id,"material-"+id.slice(0,8),title,category,price_cents).run();
   await env.DB.prepare("INSERT INTO audit_logs(id,action,actor,target) VALUES(?,?,?,?)").bind(uuid(),"mcp_product_create",actor,id).run();
   return output({id,status:"draft"});
  }catch{return failure("Falha no cadastro")}
 });
 s.registerTool("products_price_update",{description:"Alterar preço de futuras compras; pedidos pagos preservam snapshot",inputSchema:{id:z.string().uuid(),price_cents:z.number().int().min(100).max(20000000)}},async({id,price_cents})=>{
  try{
   const result=await env.DB.prepare("UPDATE products SET price_cents=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('draft','published')").bind(price_cents,id).run();
   if((result.meta?.changes||0)!==1)return failure("Produto não encontrado");
   await env.DB.prepare("INSERT INTO audit_logs(id,action,actor,target) VALUES(?,?,?,?)").bind(uuid(),"mcp_price_update",actor,id).run();
   return output({id,price_cents,updated:true});
  }catch{return failure("Preço não atualizado")}
 });
 s.registerTool("products_publish",{description:"Publicar PDF importado e conferido; exige confirmação de autoria/licença",inputSchema:{id:z.string().uuid(),copyright_checked:z.literal(true)}},async({id})=>{
  try{
   const p=await env.DB.prepare("SELECT original_key,status FROM products WHERE id=?").bind(id).first<{original_key:string|null;status:string}>();
   if(!p||p.status!=="draft"||!p.original_key||!await env.PDFS.head(p.original_key))return failure("Produto não pronto: revisar e importar PDF");
   const c=await env.DB.prepare("UPDATE products SET status='published',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='draft'").bind(id).run();
   if((c.meta?.changes||0)!==1)return failure("Publicação concorrente; revalidar");
   await env.DB.prepare("INSERT INTO audit_logs(id,action,actor,target) VALUES(?,?,?,?)").bind(uuid(),"mcp_publish",actor,id).run();
   return output({id,status:"published"});
  }catch{return failure("Falha na publicação")}
 });
 s.registerTool("delivery_retry",{description:"Agendar nova tentativa somente para entrega falha de pedido pago",inputSchema:{order_id:z.string().uuid()}},async({order_id})=>{
  try{
   const verified=await env.DB.prepare("SELECT id,status FROM orders WHERE id=? AND status IN ('paid','delivered')").bind(order_id).first();
   if(!verified)return failure("Pedido sem pagamento confirmado");
   const r=await env.DB.prepare("UPDATE deliveries SET status='pending',updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND status='error'").bind(order_id).run();
   await env.DB.prepare("INSERT INTO audit_logs(id,action,actor,target) VALUES(?,?,?,?)").bind(uuid(),"mcp_retry_delivery",actor,order_id).run();
   return output({order_id,queued:r.meta?.changes||0});
  }catch{return failure("Reenvio indisponível")}
 });
 s.registerTool("developer_status",{description:"Prontidão de desenvolvimento, revisão e deploy protegidos",inputSchema:{}},async()=>
  output({repository:"cronogramaatp-code/Atpcursos",environment:env.ENVIRONMENT||"staging",github_token_configured:!!env.GITHUB_TOKEN,production_deploy_allowed:env.ALLOW_PRODUCTION_DEPLOY==="true"&&env.PRODUCTION_PROJECT_READY==="true"&&!!env.GITHUB_TOKEN,reason:env.GITHUB_TOKEN?"Deployment requires explicit confirmation, current SHA, CI PASS and fast-forward main":"GitHub repository credential not configured"}));
 s.registerTool("quality_gate",{description:"Consultar controles de release sem acionar publicação",inputSchema:{}},async()=>output({
  status:"PARTIAL",tests:"requires validated CI evidence",payments:"requires independent test",oauth:"requires Access and cross-account Inspector",production_deploy:"BLOCKED until PASS"}));
registerDeveloperTools(s,env,actor);
 return s;
}
const unauthorized=()=>new Response("MCP não autorizado",{status:401,headers:{"WWW-Authenticate":"Bearer realm=\"ATPCursos MCP\"","cache-control":"no-store"}});
export default {
 async fetch(req:Request,env:Env,ctx:ExecutionContext):Promise<Response>{
  if(new URL(req.url).pathname==="/health")return new Response(JSON.stringify({app:"atpcursos-mcp",ready:!!env.ACCESS_AUD&&!!env.ACCESS_TEAM_DOMAIN&&!!env.DB}),{headers:{"content-type":"application/json","cache-control":"no-store"}});
  if(new URL(req.url).pathname!=="/mcp")return new Response("Not found",{status:404});
  if(!env.DB||!env.PDFS)return new Response("Bindings absent",{status:503});
  const owner=await authenticate(req,env);if(!owner)return unauthorized();
  return createMcpHandler(()=>makeServer(env,owner))(req,env,ctx);
 }
};
