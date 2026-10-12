import { Env, plain, now, sha256, uuid } from "./infra";
import { personalize } from "./pdf-personalize";
import { MAX_PDF_BYTES } from "./product-files";

type Snapshot={id:string;title_snapshot:string;original_key_snapshot:string};
type Delivery={id:string;status:string;personalized_key:string|null};
const tokenPattern=/^[a-f\d-]{72}$/i;
const cleanLabel=(name:string)=>name.replace(/[<>\r\n]/g," ").slice(0,125);

/** Returns false only for orders created before multi-PDF snapshots existed. */
export async function fulfillBundleOrder(env:Env,orderId:string):Promise<boolean>{
 const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM order_item_files f JOIN order_items i ON i.id=f.order_item_id WHERE i.order_id=?")
  .bind(orderId).first<{n:number}>();
 if(!count?.n)return false;
 if(!env.RESEND_API_KEY||!env.RESEND_FROM_EMAIL||!env.PUBLIC_BASE_URL||!env.PDFS)return true;
 const order=await env.DB.prepare("SELECT buyer_name,buyer_email,status FROM orders WHERE id=?")
  .bind(orderId).first<{buyer_name:string;buyer_email:string;status:string}>();
 if(!order||!["paid","delivered"].includes(order.status))return true;
 const snapshots=await env.DB.prepare("SELECT f.id,f.title_snapshot,f.original_key_snapshot FROM order_item_files f JOIN order_items i ON i.id=f.order_item_id WHERE i.order_id=? ORDER BY i.id,f.position")
  .bind(orderId).all<Snapshot>();
 if(!snapshots.results.length)return true;
 // Avoid doing all expensive PDF transformations in one Worker invocation.
 let processed=0;
 for(const f of snapshots.results){
  if(processed>=2)break;
  await env.DB.prepare("INSERT OR IGNORE INTO bundle_deliveries(id,order_item_file_id,order_id,status) VALUES(?,?,?,'pending')")
   .bind(uuid(),f.id,orderId).run();
  const delivery=await env.DB.prepare("SELECT id,status,personalized_key FROM bundle_deliveries WHERE order_item_file_id=?")
   .bind(f.id).first<Delivery>();
  if(!delivery||!["pending","error","processing"].includes(delivery.status))continue;
  const claim=await env.DB.prepare("UPDATE bundle_deliveries SET status='processing',updated_at=CURRENT_TIMESTAMP WHERE id=? AND (status IN ('pending','error') OR (status='processing' AND updated_at<datetime('now','-10 minutes')))")
   .bind(delivery.id).run();
  if((claim.meta?.changes||0)!==1)continue;
  processed++;
  try{
   const raw=await env.PDFS.get(f.original_key_snapshot);
   if(!raw||raw.size>MAX_PDF_BYTES)throw Error("PDF_UNAVAILABLE");
   const font=await env.ASSETS.fetch("https://assets.local/fonts/NotoSans-Regular.ttf");
   if(!font.ok)throw Error("WATERMARK_FONT_MISSING");
   const marked=await personalize(await raw.arrayBuffer(),order.buyer_name,order.buyer_email,await font.arrayBuffer());
   const key="personalized-bundles/"+orderId+"/"+delivery.id+".pdf";
   await env.PDFS.put(key,marked,{httpMetadata:{contentType:"application/pdf"}});
   await env.DB.prepare("UPDATE bundle_deliveries SET status='ready',personalized_key=?,updated_at=CURRENT_TIMESTAMP,error_code=NULL WHERE id=?")
    .bind(key,delivery.id).run();
  }catch(err){
   await env.DB.prepare("UPDATE bundle_deliveries SET status='error',error_code=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .bind(err instanceof Error?err.message.slice(0,40):"PROCESSING_ERROR",delivery.id).run();
  }
 }
 const remaining=await env.DB.prepare("SELECT COUNT(*) AS pending FROM order_item_files f JOIN order_items i ON i.id=f.order_item_id LEFT JOIN bundle_deliveries d ON d.order_item_file_id=f.id WHERE i.order_id=? AND (d.id IS NULL OR d.status NOT IN ('ready','sent'))")
  .bind(orderId).first<{pending:number}>();
 if(remaining?.pending)return true;
 // Only one process may send the email for the entire order.
 await env.DB.prepare("INSERT OR IGNORE INTO bundle_notifications(order_id,status) VALUES(?,'pending')").bind(orderId).run();
 const claim=await env.DB.prepare("UPDATE bundle_notifications SET status='processing',updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND (status IN ('pending','error') OR (status='processing' AND updated_at<datetime('now','-10 minutes')))")
  .bind(orderId).run();
 if((claim.meta?.changes||0)!==1)return true;
 try{
  const ready=await env.DB.prepare("SELECT d.id,f.title_snapshot FROM bundle_deliveries d JOIN order_item_files f ON f.id=d.order_item_file_id WHERE d.order_id=? AND d.status IN ('ready','sent') ORDER BY f.order_item_id,f.position")
   .bind(orderId).all<{id:string;title_snapshot:string}>();
  if(ready.results.length!==snapshots.results.length)throw Error("BUNDLE_INCOMPLETE");
  const links:string[]=[];
  for(const f of ready.results){
   const token=uuid()+uuid();
   await env.DB.prepare("INSERT INTO bundle_download_tokens(token_hash,delivery_id,expires_at,remaining_uses) VALUES(?,?,?,?)")
    .bind(await sha256(token),f.id,now()+72*3600,5).run();
   links.push(cleanLabel(f.title_snapshot)+"\n"+env.PUBLIC_BASE_URL+"/api/bundle-download/"+token);
  }
  const message="Seus materiais personalizados ATPCursos estão prontos.\n\n"+links.join("\n\n")+"\n\nCada link expira em 72 horas e permite até 5 downloads.";
  const mail=await fetch("https://api.resend.com/emails",{
   method:"POST",headers:{"authorization":"Bearer "+env.RESEND_API_KEY,"content-type":"application/json","Idempotency-Key":"bundle-"+orderId},
   body:JSON.stringify({from:env.RESEND_FROM_EMAIL,to:[order.buyer_email],subject:"Seus PDFs ATPCursos estão prontos",text:message})
  });
  if(!mail.ok)throw Error("EMAIL_UNAVAILABLE");
  await env.DB.prepare("UPDATE bundle_notifications SET status='sent',sent_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE order_id=?").bind(orderId).run();
  await env.DB.prepare("UPDATE bundle_deliveries SET status='sent',sent_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND status='ready'").bind(orderId).run();
  await env.DB.prepare("UPDATE orders SET status='delivered' WHERE id=? AND status='paid'").bind(orderId).run();
 }catch(err){
  await env.DB.prepare("UPDATE bundle_notifications SET status='error',updated_at=CURRENT_TIMESTAMP WHERE order_id=?").bind(orderId).run();
 }
 return true;
}

export async function getBundleDownload(env:Env,token:string){
 if(!tokenPattern.test(token))return plain("Link inválido",403);
 const rec=await env.DB.prepare("SELECT t.remaining_uses,t.expires_at,d.personalized_key,o.status FROM bundle_download_tokens t JOIN bundle_deliveries d ON d.id=t.delivery_id JOIN orders o ON o.id=d.order_id WHERE t.token_hash=? AND t.revoked_at IS NULL")
 .bind(await sha256(token)).first<{remaining_uses:number;expires_at:number;personalized_key:string|null;status:string}>();
 if(!rec?.personalized_key||!["paid","delivered"].includes(rec.status)||rec.expires_at<now()||rec.remaining_uses<=0)
  return plain("Link inválido ou expirado",403);
 const file=await env.PDFS.get(rec.personalized_key);
 if(!file)return plain("Arquivo indisponível",503);
 const updated=await env.DB.prepare("UPDATE bundle_download_tokens SET remaining_uses=remaining_uses-1 WHERE token_hash=? AND revoked_at IS NULL AND expires_at>? AND remaining_uses>0")
  .bind(await sha256(token),now()).run();
 if((updated.meta?.changes||0)!==1)return plain("Limite de downloads atingido",403);
 return new Response(file.body,{headers:{"content-type":"application/pdf","content-disposition":"attachment; filename=ATPCursos-personalizado.pdf","cache-control":"private, no-store","referrer-policy":"no-referrer","x-content-type-options":"nosniff"}});
}
