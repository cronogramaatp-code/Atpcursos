import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { Env,json,plain,readJSON,emailHash,now,uuid } from "./infra";
import {normalizeEmail,validEmail,validPassword,secretHash,newSecret,passwordHash,passwordMatch} from "./domain/customer";

const customerCookie="atp_customer_session";
function getCookie(req:Request,key:string){
 const match=(req.headers.get("cookie")||"").split(";").map(v=>v.trim()).find(v=>v.startsWith(key+"="));
 return match?.slice(key.length+1)||"";
}
export async function sessionUser(req:Request,env:Env):Promise<{id:string;full_name:string;email:string}|null>{
 const raw=getCookie(req,customerCookie);
 if(!/^[0-9a-f]{64}$/.test(raw))return null;
 const hash=await secretHash(raw);
 return env.DB.prepare("SELECT c.id,c.full_name,c.email FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND c.status='active'").bind(hash,now()).first();
}
export async function login(req:Request,env:Env){
 const body=await readJSON(req,1000);
 const email=typeof body.email==="string"?normalizeEmail(body.email):"";
 const password=typeof body.password==="string"?body.password:"";
 if(!validEmail(email)||!validPassword(password))return json({error:"Credenciais inválidas"},401);
 if(!env.BUYER_HASH_KEY)return json({error:"Configuração de acesso pendente"},503);
 // Five password attempts per recipient address per 15-minute rolling window.
 const identifier=await emailHash(email,env.BUYER_HASH_KEY),timestamp=now();
 await env.DB.prepare("INSERT INTO customer_login_limits(email_hash,window_start,attempts) VALUES(?,?,1) ON CONFLICT(email_hash) DO UPDATE SET window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END, attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END")
 .bind(identifier,timestamp,timestamp-900,timestamp-900).run();
 const throttle=await env.DB.prepare("SELECT attempts FROM customer_login_limits WHERE email_hash=?").bind(identifier).first<{attempts:number}>();
 if((throttle?.attempts||0)>5)return json({error:"Muitas tentativas; aguarde 15 minutos"},429);
 const record=await env.DB.prepare("SELECT id,password_salt,password_digest,password_iterations FROM customers WHERE email=? COLLATE NOCASE AND status='active'").bind(email)
  .first<{id:string;password_salt:string|null;password_digest:string|null;password_iterations:number|null}>();
 if(!record?.password_salt||!record.password_digest||!record.password_iterations||
  !(await passwordMatch(password,record.password_salt,record.password_digest,record.password_iterations)))return json({error:"Credenciais inválidas"},401);
 await env.DB.prepare("DELETE FROM customer_login_limits WHERE email_hash=?").bind(identifier).run();
 const secret=newSecret(),hash=await secretHash(secret);
 await env.DB.prepare("INSERT INTO customer_sessions(token_hash,customer_id,expires_at) VALUES(?,?,?)")
 .bind(hash,record.id,now()+14*86400).run();
 const response=json({ok:true});
 response.headers.set("set-cookie",customerCookie+"="+secret+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1209600");
 return response;
}
export async function logout(req:Request,env:Env){
 const raw=getCookie(req,customerCookie);
 if(/^[0-9a-f]{64}$/.test(raw))await env.DB.prepare("UPDATE customer_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=?").bind(await secretHash(raw)).run();
 const response=json({ok:true});
 response.headers.set("set-cookie",customerCookie+"=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
 return response;
}
export async function myAccount(req:Request,env:Env){
 const user=await sessionUser(req,env);if(!user)return json({error:"Faça login"},401);
 const result=await env.DB.prepare("SELECT g.id,p.title,g.status,g.expires_at FROM courtesy_grants g JOIN products p ON p.id=g.product_id WHERE g.customer_id=? AND g.status='active' AND (g.expires_at IS NULL OR g.expires_at>?) ORDER BY g.created_at DESC").bind(user.id,now()).all();
 return json({customer:user,courtesies:result.results});
}
export async function applyAction(req:Request,env:Env,action:string){
 if(action!=="password_reset"&&action!=="email_change")return json({error:"Ação não permitida"},404);
 const data=await readJSON(req,2048);const token=typeof data.token==="string"?data.token:"";
 if(!/^[0-9a-f]{64}$/.test(token))return json({error:"Link inválido"},400);
 const hash=await secretHash(token);
 const row=await env.DB.prepare("SELECT customer_id,pending_email FROM customer_action_tokens WHERE token_hash=? AND action=? AND used_at IS NULL AND expires_at>?")
 .bind(hash,action,now()).first<{customer_id:string;pending_email:string|null}>();
 if(!row)return json({error:"Link expirado ou já utilizado"},403);
 if(action==="password_reset"){
  const pass=typeof data.password==="string"?data.password:"";
  if(!validPassword(pass))return json({error:"A senha precisa ter de 12 a 128 caracteres"},422);
  const cred=await passwordHash(pass);
  const statements=[
    env.DB.prepare("UPDATE customer_action_tokens SET used_at=CURRENT_TIMESTAMP WHERE token_hash=? AND used_at IS NULL AND expires_at>?").bind(hash,now()),
    env.DB.prepare("UPDATE customers SET password_salt=?,password_digest=?,password_iterations=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='active'").bind(cred.salt,cred.digest,cred.iterations,row.customer_id),
    env.DB.prepare("UPDATE customer_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE customer_id=? AND revoked_at IS NULL").bind(row.customer_id)
  ];
  const batch=await env.DB.batch(statements);
  if((batch[0].meta?.changes||0)!==1)return json({error:"Link já utilizado"},403);
 }else{
  const email=row.pending_email||"";
  if(!validEmail(email))return json({error:"E-mail inválido"},422);
  const existing=await env.DB.prepare("SELECT id FROM customers WHERE email=? COLLATE NOCASE").bind(email).first<{id:string}>();
  if(existing&&existing.id!==row.customer_id)return json({error:"E-mail já cadastrado"},409);
  if(!env.BUYER_HASH_KEY)return json({error:"Configuração pendente"},503);
  const batch=await env.DB.batch([
   env.DB.prepare("UPDATE customer_action_tokens SET used_at=CURRENT_TIMESTAMP WHERE token_hash=? AND used_at IS NULL AND expires_at>?").bind(hash,now()),
   env.DB.prepare("UPDATE customers SET email=?,email_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='active'").bind(email,await emailHash(email,env.BUYER_HASH_KEY),row.customer_id),
   env.DB.prepare("UPDATE customer_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE customer_id=? AND revoked_at IS NULL").bind(row.customer_id),
   env.DB.prepare("UPDATE courtesy_download_tokens SET revoked_at=CURRENT_TIMESTAMP WHERE grant_id IN (SELECT id FROM courtesy_grants WHERE customer_id=?) AND revoked_at IS NULL").bind(row.customer_id)
  ]);
  if((batch[0].meta?.changes||0)!==1)return json({error:"Link já utilizado"},403);
 }
 await env.DB.prepare("INSERT INTO audit_logs(id,action,actor,target) VALUES(?,?,?,?)").bind(uuid(),action==="email_change"?"email_change_confirmed":"password_reset_completed","verified_customer",row.customer_id).run();
 return json({ok:true});
}
type CourtesyDoc={token_hash?:string;remaining_uses?:number;status:string;expires_at:number|null;full_name:string;email:string;title:string;original_key:string|null;customer_id:string};
async function markedPdf(env:Env,row:CourtesyDoc):Promise<Response>{
 if(!row.original_key)return plain("PDF indisponível",503);
 const source=await env.PDFS.get(row.original_key);
 if(!source||source.size>8*1024*1024)return plain("Arquivo em processamento: solicite suporte",503);
 const pdf=await PDFDocument.load(await source.arrayBuffer());
 if(pdf.getPageCount()<1||pdf.getPageCount()>300)return plain("Documento excede o limite provisório",503);
 const font=await pdf.embedFont(StandardFonts.Helvetica);
 const name="EXCLUSIVO: "+row.full_name.replace(/[\r\n<>]/g," ").slice(0,120);
 const email=row.email.replace(/[\r\n<>]/g," ").slice(0,254);
 for(const page of pdf.getPages()){
  const {width,height}=page.getSize();
  const fontSize=Math.min(14,Math.max(7,(width*0.7)/font.widthOfTextAtSize(name,1)));
  page.drawText(name,{x:width*0.1,y:height*0.52,size:fontSize,font,rotate:degrees(23),color:rgb(0.12,0.30,0.55),opacity:0.16});
  const footerSize=Math.min(9,Math.max(5,(width-30)/font.widthOfTextAtSize(email,1)));
  page.drawText(email,{x:16,y:14,size:footerSize,font,color:rgb(0.2,0.3,0.4),opacity:0.5});
 }
 const bytes=await pdf.save();
 return new Response(new Uint8Array(bytes).buffer,{headers:{"content-type":"application/pdf","content-disposition":"attachment; filename=ATPCursos-cortesia.pdf","cache-control":"private, no-store","referrer-policy":"no-referrer","x-content-type-options":"nosniff"}});
}
export async function courtesyDownload(env:Env,token:string){
 if(!/^[0-9a-f]{64}$/.test(token))return plain("Link inválido",403);
 const hash=await secretHash(token);
 const row=await env.DB.prepare("SELECT t.remaining_uses,t.expires_at AS token_expires,g.expires_at,g.status,c.id AS customer_id,c.full_name,c.email,p.title,p.original_key FROM courtesy_download_tokens t JOIN courtesy_grants g ON g.id=t.grant_id JOIN customers c ON c.id=g.customer_id JOIN products p ON p.id=g.product_id WHERE t.token_hash=? AND t.revoked_at IS NULL AND t.expires_at>? AND t.remaining_uses>0 AND c.status='active' AND p.status='published'")
  .bind(hash,now()).first<CourtesyDoc>();
 if(!row||row.status!=="active"||(row.expires_at!==null&&row.expires_at<=now()))return plain("Cortesia indisponível",403);
 const file=await markedPdf(env,row);
 if(file.status!==200)return file;
 const usage=await env.DB.prepare("UPDATE courtesy_download_tokens SET remaining_uses=remaining_uses-1 WHERE token_hash=? AND remaining_uses>0 AND expires_at>? AND revoked_at IS NULL").bind(hash,now()).run();
 if((usage.meta?.changes||0)!==1)return plain("Limite de acesso excedido",403);
 return file;
}
export async function courtesySessionDownload(req:Request,env:Env,grantId:string){
 const user=await sessionUser(req,env);if(!user)return plain("Acesso não autorizado",401);
 const row=await env.DB.prepare("SELECT g.status,g.expires_at,c.id AS customer_id,c.full_name,c.email,p.title,p.original_key FROM courtesy_grants g JOIN customers c ON c.id=g.customer_id JOIN products p ON p.id=g.product_id WHERE g.id=? AND g.customer_id=? AND p.status='published'")
  .bind(grantId,user.id).first<CourtesyDoc>();
 if(!row||row.status!=="active"||(row.expires_at!==null&&row.expires_at<=now()))return plain("Sem acesso",403);
 return markedPdf(env,row);
}
