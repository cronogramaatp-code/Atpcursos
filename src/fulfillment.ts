import { PDFDocument, degrees, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { Env, plain, uuid, now, sha256 } from "./infra";

/**
 * Stamp the exact buyer identity using an OFL-licensed Unicode font.
 * Never normalize, transliterate or strip buyer names.
 */
export async function personalize(source:ArrayBuffer,name:string,email:string,fontBytes:ArrayBuffer):Promise<Uint8Array> {
 const doc=await PDFDocument.load(source,{ignoreEncryption:false});
 doc.registerFontkit(fontkit);
 const font=await doc.embedFont(fontBytes,{subset:true});
 const buyer=name.trim();
 const recipient=email.trim();
 if(!buyer||!recipient)throw Error("EMPTY_WATERMARK_IDENTITY");
 const centered="EXCLUSIVO: "+buyer+" | "+recipient;
 const footer="ATPCursos | "+buyer+" | "+recipient;
 const pages=doc.getPages();
 if(!pages.length)throw Error("PDF_WITHOUT_PAGES");
 for(const page of pages){
  const {width,height}=page.getSize();
  const size=Math.max(6,Math.min(16,(width*0.69)/Math.max(1,font.widthOfTextAtSize(centered,1))));
  page.drawText(centered,{
   x:width*0.09,y:height*0.51,size,font,rotate:degrees(25),
   color:rgb(.24,.36,.58),opacity:.16
  });
  const fs=Math.max(5,Math.min(8,(width-32)/Math.max(1,font.widthOfTextAtSize(footer,1))));
  page.drawText(footer,{
   x:16,y:Math.min(17,height*.027),size:fs,font,
   color:rgb(.22,.32,.47),opacity:.58
  });
 }
 return doc.save();
}
export async function fulfillOrder(env:Env,id:string){
 if(!env.RESEND_API_KEY||!env.RESEND_FROM_EMAIL||!env.PUBLIC_BASE_URL||!env.PDFS)return;
 const order=await env.DB.prepare("SELECT buyer_name,buyer_email,status FROM orders WHERE id=?").bind(id)
 .first<{buyer_name:string;buyer_email:string;status:string}>();
 if(!order||!["paid","delivered"].includes(order.status))return;
 const items=await env.DB.prepare("SELECT id,title_snapshot,original_key_snapshot FROM order_items WHERE order_id=?")
 .bind(id).all<{id:string;title_snapshot:string;original_key_snapshot:string}>();
 for(const item of items.results){
  let delivery=await env.DB.prepare("SELECT id,status FROM deliveries WHERE order_item_id=?").bind(item.id)
   .first<{id:string;status:string}>();
  if(delivery?.status==="sent"||delivery?.status==="revoked")continue;
  if(!delivery){
   await env.DB.prepare("INSERT OR IGNORE INTO deliveries(id,order_item_id,order_id,status) VALUES(?,?,?,'pending')")
    .bind(uuid(),item.id,id).run();
   delivery=await env.DB.prepare("SELECT id,status FROM deliveries WHERE order_item_id=?").bind(item.id).first<{id:string;status:string}>();
  }
  if(!delivery)continue;
  const claim=await env.DB.prepare("UPDATE deliveries SET status='processing',updated_at=CURRENT_TIMESTAMP WHERE id=? AND (status IN ('pending','error') OR (status='processing' AND updated_at<datetime('now','-10 minutes')))")
  .bind(delivery.id).run();
  if((claim.meta?.changes||0)!==1)continue;
  try{
   const raw=await env.PDFS.get(item.original_key_snapshot);
   if(!raw||raw.size>15*1024*1024)throw Error("PDF_UNAVAILABLE");
   // Font is an open-licensed static asset; the paid PDF never becomes public.
   const fontAsset=await env.ASSETS.fetch("https://assets.local/fonts/NotoSans-Regular.ttf");
   if(!fontAsset.ok)throw Error("WATERMARK_FONT_MISSING");
   const marked=await personalize(
    await raw.arrayBuffer(),order.buyer_name,order.buyer_email,
    await fontAsset.arrayBuffer()
   );
   const key="personalized/"+id+"/"+item.id+".pdf";
   await env.PDFS.put(key,marked,{httpMetadata:{contentType:"application/pdf"}});
   const token=uuid()+uuid(),tokenHash=await sha256(token);
   await env.DB.prepare("INSERT INTO download_tokens(token_hash,delivery_id,expires_at,remaining_uses) VALUES(?,?,?,?)")
    .bind(tokenHash,delivery.id,now()+72*3600,5).run();
   const link=env.PUBLIC_BASE_URL+"/api/download/"+token;
   const title=item.title_snapshot.replace(/[<>\r\n]/g," ").slice(0,120);
   const emailResponse=await fetch("https://api.resend.com/emails",{method:"POST",
    headers:{"authorization":"Bearer "+env.RESEND_API_KEY,"content-type":"application/json","Idempotency-Key":delivery.id},
    body:JSON.stringify({from:env.RESEND_FROM_EMAIL,to:[order.buyer_email],
     subject:"Seu material ATPCursos está pronto",text:"Material: "+title+"\nAcesse seu PDF personalizado: "+link+"\nO link expira em 72 horas e permite até 5 downloads."})});
   if(!emailResponse.ok)throw Error("EMAIL_UNAVAILABLE");
   await env.DB.prepare("UPDATE deliveries SET status='sent',personalized_key=?,sent_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,error_code=NULL WHERE id=?")
    .bind(key,delivery.id).run();
  }catch(e){
   // No raw exception logging: avoid leaking buyer names, URLs and provider details.
   await env.DB.prepare("UPDATE deliveries SET status='error',error_code=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .bind(e instanceof Error?e.message.slice(0,40):"ERROR",delivery.id).run();
  }
 }
 const status=await env.DB.prepare("SELECT (SELECT COUNT(*) FROM order_items WHERE order_id=?) AS total,(SELECT COUNT(*) FROM deliveries WHERE order_id=? AND status='sent') AS sent")
 .bind(id,id).first<{total:number;sent:number}>();
 if(status&&status.total>0&&status.total===status.sent){
  await env.DB.prepare("UPDATE orders SET status='delivered' WHERE id=? AND status='paid'").bind(id).run();
 }
}
export async function getDownload(env:Env,token:string){
 if(token.length!==72||!/^[a-f\d-]+$/i.test(token))return plain("Link inválido",403);
 const hash=await sha256(token);
 const rec=await env.DB.prepare("SELECT t.remaining_uses,t.expires_at,d.personalized_key,o.status FROM download_tokens t JOIN deliveries d ON d.id=t.delivery_id JOIN orders o ON o.id=d.order_id WHERE t.token_hash=? AND t.revoked_at IS NULL")
 .bind(hash).first<{remaining_uses:number;expires_at:number;personalized_key:string|null;status:string}>();
 if(!rec||!rec.personalized_key||!["paid","delivered"].includes(rec.status)||rec.expires_at<now()||rec.remaining_uses<=0)
  return plain("Link inválido ou expirado",403);
 const file=await env.PDFS.get(rec.personalized_key);
 if(!file)return plain("Arquivo indisponível",503);
 const updated=await env.DB.prepare("UPDATE download_tokens SET remaining_uses=remaining_uses-1 WHERE token_hash=? AND revoked_at IS NULL AND expires_at>? AND remaining_uses>0")
 .bind(hash,now()).run();
 if((updated.meta?.changes||0)!==1)return plain("Limite de downloads atingido",403);
 return new Response(file.body,{headers:{"content-type":"application/pdf","content-disposition":"attachment; filename=ATPCursos-personalizado.pdf",
  "cache-control":"private, no-store","referrer-policy":"no-referrer","x-content-type-options":"nosniff"}});
}
