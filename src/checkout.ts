import { Env, json, uuid, readJSON, moneyOK, emailOK, emailHash } from "./infra";
import { quotePrice } from "./domain/pricing";
import { fulfillOrder } from "./fulfillment";
import { notifyConfirmedSale } from "./sale-alerts";
import { isTrustedCheckoutUrl,verifiedPaymentAmount } from "./domain/infinitepay";
type P={id:string;title:string;price_cents:number;original_key:string};
const isUUID=(v:string)=>/^[a-f0-9-]{36}$/i.test(v);
export async function quote(env:Env,email:string,ids:string[]){
 if(!env.BUYER_HASH_KEY)throw Error("hash secret unavailable");
 if(!emailOK(email)||ids.length===0||ids.length>20||new Set(ids).size!==ids.length)throw Error("invalid order");
 const products:P[]=[];
 for(const id of ids) {
  if(!isUUID(id))throw Error("invalid order");
  const p=await env.DB.prepare("SELECT p.id,p.title,p.price_cents, (SELECT f.original_key FROM product_files f WHERE f.product_id=p.id AND f.original_key IS NOT NULL AND f.original_key<>'' ORDER BY f.position,f.created_at,f.id LIMIT 1) AS original_key FROM products p WHERE p.id=? AND p.status='published'")
   .bind(id).first<P>();
  if(!p||!moneyOK(p.price_cents)||!p.original_key)throw Error("invalid order");
  products.push(p);
 }
 const hash=await emailHash(email,env.BUYER_HASH_KEY);
 const result=await env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE buyer_email_hash=? AND status IN ('paid','delivered')")
  .bind(hash).first<{n:number}>();
 return {products,hash,pricing:quotePrice(products.map(p=>({id:p.id,priceCents:p.price_cents})),result?.n||0)};
}
export async function createCheckout(req:Request,env:Env){
 if(env.CHECKOUT_ENABLED!=="true"||!env.INFINITEPAY_HANDLE||!env.BUYER_HASH_KEY)return json({error:"Pagamento ainda em configuração"},503);
 const d=await readJSON(req),name=typeof d.name==="string"?d.name.trim():"",
 email=typeof d.email==="string"?d.email.trim().toLowerCase():"",
 ids=Array.isArray(d.productIds)&&d.productIds.every(x=>typeof x==="string")?d.productIds as string[]:[];
 if(name.length<2||name.length>120||/[<>\x00-\x1f]/.test(name)||!emailOK(email))return json({error:"Nome ou e-mail inválidos"},422);
 const {products,hash,pricing}=await quote(env,email,ids),orderId=uuid();
 // Read and validate all bundle files before inserting any order rows.
 const fileSets: {itemId:string;product:P;files:{id:string;title:string;original_key:string;position:number}[]}[]=[];
 for(const p of products){
  const files=await env.DB.prepare("SELECT id,title,original_key,position FROM product_files WHERE product_id=? ORDER BY position,created_at,id")
   .bind(p.id).all<{id:string;title:string;original_key:string;position:number}>();
  if(!files.results.length||files.results.some(f=>!f.id||!f.original_key||!f.title))throw Error("product invalid");
  fileSets.push({itemId:uuid(),product:p,files:files.results});
 }
 // D1 batch executes these statements as one transaction: a failure rolls back
 // the order and its immutable product-file snapshots before payment creation.
 const statements:D1PreparedStatement[]=[
  env.DB.prepare("INSERT INTO orders(id,buyer_name,buyer_email,buyer_email_hash,status,total_cents,full_cents,discount_cents,discount_rate,provider_order_nsu) VALUES(?,?,?,?,?,?,?,?,?,?)")
   .bind(orderId,name,email,hash,"pending",pricing.totalCents,pricing.fullCents,pricing.discountCents,pricing.ratePercent,orderId)
 ];
 for(const {itemId,product:p,files} of fileSets){
  statements.push(env.DB.prepare("INSERT INTO order_items(id,order_id,product_id,title_snapshot,price_snapshot_cents,original_key_snapshot) VALUES(?,?,?,?,?,?)")
   .bind(itemId,orderId,p.id,p.title,p.price_cents,files[0].original_key));
  files.forEach((f,pos)=>statements.push(
   env.DB.prepare("INSERT INTO order_item_files(id,order_item_id,product_file_id,title_snapshot,original_key_snapshot,position) VALUES(?,?,?,?,?,?)")
   .bind(uuid(),itemId,f.id,f.title,f.original_key,pos)
  ));
 }
 await env.DB.batch(statements); const origin=env.PUBLIC_BASE_URL||new URL(req.url).origin;
 const r=await fetch("https://api.checkout.infinitepay.io/links",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({handle:env.INFINITEPAY_HANDLE,order_nsu:orderId,
   redirect_url:origin+"/meus-materiais",webhook_url:origin+"/api/webhooks/infinitepay",
   items:[{quantity:1,price:pricing.totalCents,description:"Pedido digital atpconcursos "+orderId.slice(0,8)}],
   customer:{name,email}})});
 const res=await r.json() as {url?:string;link?:string;checkout_url?:string};
 const checkoutUrl=res.url||res.link||res.checkout_url||"";
 const valid=isTrustedCheckoutUrl(checkoutUrl);
 if(!r.ok||!valid){
  await env.DB.prepare("UPDATE orders SET status='checkout_failed' WHERE id=? AND status='pending'").bind(orderId).run();
  return json({error:"Não foi possível abrir pagamento"},502);
 }
 return json({orderId,checkoutUrl,pricing});
}
export async function confirmPayment(env:Env,id:string,transaction:string,slug:string){
 if(!env.INFINITEPAY_HANDLE||!isUUID(id)||transaction.length<4||slug.length<2)return false;
 const order=await env.DB.prepare("SELECT total_cents,status FROM orders WHERE id=?").bind(id)
  .first<{total_cents:number;status:string}>();
 if(!order||order.status==="refunded")return false;
 if(["paid","delivered"].includes(order.status))return true;
 if(order.status!=="pending")return false;
 const r=await fetch("https://api.checkout.infinitepay.io/payment_check",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({handle:env.INFINITEPAY_HANDLE,order_nsu:id,transaction_nsu:transaction,slug})});
 if(!r.ok)return false;
 const j=await r.json() as {success?:boolean;paid?:boolean;amount?:number};
 if(!verifiedPaymentAmount(j,order.total_cents))return false;
 const update=await env.DB.prepare("UPDATE orders SET status='paid',transaction_nsu=?,paid_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'")
  .bind(transaction,id).run();
 if((update.meta?.changes||0)!==1)return false;
 // Register verified buyers as students without requiring an account password.
 // Password creation is always an email-confirmed optional action.
 try{
  const buyer=await env.DB.prepare("SELECT buyer_name,buyer_email,buyer_email_hash FROM orders WHERE id=?")
   .bind(id).first<{buyer_name:string;buyer_email:string;buyer_email_hash:string}>();
  if(buyer)await env.DB.prepare("INSERT OR IGNORE INTO customers(id,full_name,email,email_hash) VALUES(?,?,?,?)")
   .bind(uuid(),buyer.buyer_name,buyer.buyer_email,buyer.buyer_email_hash).run();
 }catch{
  // A transient account-provisioning failure must not invalidate verified payment.
  // Reconciliation may backfill after recovery.
 }
 return true;
}
export async function receiveWebhook(req:Request,env:Env,ctx:ExecutionContext){
 const d=await readJSON(req,8192);
 const id=typeof d.order_nsu==="string"?d.order_nsu:"",
 transaction=typeof d.transaction_nsu==="string"?d.transaction_nsu:"",
 slug=typeof d.invoice_slug==="string"?d.invoice_slug:typeof d.slug==="string"?d.slug:"";
 if(!isUUID(id)||transaction.length<4||slug.length<2||slug.length>160)return json({error:"Evento inválido"},400);
 const exists=await env.DB.prepare("SELECT id FROM orders WHERE id=?").bind(id).first();
 if(!exists)return json({error:"Pedido desconhecido"},400);
 await env.DB.prepare("INSERT OR IGNORE INTO payment_events(id,order_id,transaction_nsu,status) VALUES(?,?,?,?)")
  .bind(uuid(),id,transaction,"received:"+slug).run();
 // No automatic fulfillment until payment_check verifies the amount server-to-server.
 ctx.waitUntil((async()=>{
  try{if(await confirmPayment(env,id,transaction,slug))await Promise.allSettled([fulfillOrder(env,id),notifyConfirmedSale(env,id)])}
  catch{/* Durable event is retained for scheduled reconciliation. */}
 })());
 return json({success:true,message:null});
}
export async function reconcile(env:Env){
 const events=await env.DB.prepare("SELECT id,order_id,transaction_nsu,status FROM payment_events WHERE status LIKE 'received:%' ORDER BY created_at DESC LIMIT 10")
  .all<{id:string;order_id:string;transaction_nsu:string;status:string}>();
 for(const e of events.results){
  try{
   if(await confirmPayment(env,e.order_id,e.transaction_nsu,e.status.slice(9))){
    await env.DB.prepare("UPDATE payment_events SET status='reconciled' WHERE id=?").bind(e.id).run();
    await Promise.allSettled([fulfillOrder(env,e.order_id),notifyConfirmedSale(env,e.order_id)]);
   }
  }catch{}
 }
 const pending=await env.DB.prepare("SELECT id FROM orders WHERE status='paid' ORDER BY paid_at ASC LIMIT 10").all<{id:string}>();
 for(const o of pending.results)try{await Promise.allSettled([fulfillOrder(env,o.id),notifyConfirmedSale(env,o.id)])}catch{}
 // Reconcile missed alerts, including already delivered orders, without blocking payment settlement.
 try {
  const missed=await env.DB.prepare("SELECT o.id FROM orders o LEFT JOIN sale_alerts a ON a.order_id=o.id WHERE o.status IN ('paid','delivered') AND (a.order_id IS NULL OR a.status='error') ORDER BY o.paid_at DESC LIMIT 20").all<{id:string}>();
  for(const o of missed.results)try{await notifyConfirmedSale(env,o.id)}catch{}
 }catch{/* The notification migration may not have run; never block reconciliation. */}

}
