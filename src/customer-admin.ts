import { Env,json,readJSON,emailHash,uuid,now } from "./infra";
import { normalizeEmail,validEmail,validName,validCourtesyExpiry,newSecret,secretHash } from "./domain/customer";

type Customer = {id:string;full_name:string;email:string;status:string};
const clean=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
const mailReady=(env:Env)=>!!(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.PUBLIC_BASE_URL);
async function send(env:Env,to:string,subject:string,message:string):Promise<boolean>{
 if(!mailReady(env))return false;
 const r=await fetch("https://api.resend.com/emails",{
  method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+env.RESEND_API_KEY!},
  body:JSON.stringify({from:env.RESEND_FROM_EMAIL,to:[to],subject,text:message})
 });
 return r.ok;
}
async function audit(env:Env,actor:string,action:string,target:string){
 await env.DB.prepare("INSERT INTO audit_logs(id,action,actor,target) VALUES(?,?,?,?)").bind(uuid(),action,actor,target).run();
}
async function customer(env:Env,id:string){
 return env.DB.prepare("SELECT id,full_name,email,status FROM customers WHERE id=?").bind(id).first<Customer>();
}
export async function listCustomers(env:Env,q:string){
 const prefix=q.trim().slice(0,80);
 const r=await env.DB.prepare("SELECT c.id,c.full_name,c.email,c.status, (SELECT COUNT(*) FROM courtesy_grants g WHERE g.customer_id=c.id AND g.status='active') AS courtesies FROM customers c WHERE c.full_name LIKE ? OR c.email LIKE ? ORDER BY c.created_at DESC LIMIT 50").bind("%"+prefix+"%","%"+prefix+"%").all();
 return json({customers:r.results});
}
export async function createCustomer(req:Request,env:Env,actor:string){
 const b=await readJSON(req);const name=clean(b.name,120),email=normalizeEmail(clean(b.email,254));
 if(!validName(name)||!validEmail(email))return json({error:"Nome ou e-mail inválidos"},422);
 if(!env.BUYER_HASH_KEY)return json({error:"Configuração segura pendente"},503);
 const id=uuid(),hash=await emailHash(email,env.BUYER_HASH_KEY);
 try{await env.DB.prepare("INSERT INTO customers(id,full_name,email,email_hash) VALUES(?,?,?,?)").bind(id,name,email,hash).run();}
 catch{return json({error:"E-mail já cadastrado"},409);}
 await audit(env,actor,"customer_create",id);
 return json({id,name,email},201);
}
export async function grantCourtesy(req:Request,env:Env,actor:string,id:string){
 const b=await readJSON(req);const productId=clean(b.productId,50),reason=clean(b.reason,200);
 const customerRecord=await customer(env,id);
 if(!customerRecord||customerRecord.status!=="active")return json({error:"Aluno não encontrado ou bloqueado"},404);
 const prod=await env.DB.prepare("SELECT id,title,original_key FROM products WHERE id=? AND status='published'").bind(productId).first<{id:string;title:string;original_key:string|null}>();
 if(!prod||!prod.original_key)return json({error:"Publique o PDF antes de liberar cortesia"},409);
 const days=b.validDays;
 if(days!==null&&days!==undefined&&(!Number.isSafeInteger(days)||Number(days)<1||Number(days)>366))return json({error:"Validade permitida: de 1 a 366 dias"},422);
 const expiry=days==null?null:now()+Number(days)*86400;
 if(!validCourtesyExpiry(expiry,now()))return json({error:"Validade inválida"},422);
 const idGrant=uuid();
 try{
  await env.DB.prepare("INSERT INTO courtesy_grants(id,customer_id,product_id,granted_by,reason,expires_at) VALUES(?,?,?,?,?,?)")
   .bind(idGrant,id,productId,actor,reason,expiry).run();
 }catch{return json({error:"Este PDF já foi concedido ao aluno; use reenvio ou revogação"},409);}
 await audit(env,actor,"courtesy_granted",idGrant);
 const issued=await issueCourtesy(env,idGrant,customerRecord,prod.title);
 return json({id:idGrant,status:"active",emailSent:issued},201);
}
export async function issueCourtesy(env:Env,grantId:string,c?:Customer,title?:string):Promise<boolean>{
 const row=await env.DB.prepare("SELECT g.id,g.status,g.expires_at,p.title,c.id AS customer_id,c.email,c.full_name FROM courtesy_grants g JOIN customers c ON c.id=g.customer_id JOIN products p ON p.id=g.product_id WHERE g.id=? AND p.status='published'").bind(grantId).first<{id:string;status:string;expires_at:number|null;title:string;customer_id:string;email:string;full_name:string}>();
 if(!row||row.status!=="active"||(row.expires_at!==null&&row.expires_at<=now()))return false;
 const recipient=c?.email||row.email;
 const token=newSecret(),hash=await secretHash(token);
 await env.DB.prepare("INSERT INTO courtesy_download_tokens(token_hash,grant_id,expires_at,remaining_uses) VALUES(?,?,?,?)")
  .bind(hash,grantId,now()+72*3600,5).run();
 const link=(env.PUBLIC_BASE_URL||"").replace(/\/$/,"")+"/api/courtesy/"+token;
 const sent=await send(env,recipient,"ATPCursos — seu PDF de cortesia",
  "Você recebeu gratuitamente: "+(title||row.title)+".\nBaixe seu PDF personalizado pelo link privado (72 horas, até 5 acessos): "+link+"\nATPCursos");
 if(!sent)await env.DB.prepare("UPDATE courtesy_download_tokens SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=?").bind(hash).run();
 return sent;
}
export async function resendCourtesy(env:Env,actor:string,grantId:string){
 const sent=await issueCourtesy(env,grantId);
 if(sent)await audit(env,actor,"courtesy_resent",grantId);
 return sent?json({ok:true}):json({error:"Não foi possível enviar. Verifique Resend e a cortesia"},503);
}
export async function revokeCourtesy(env:Env,actor:string,grantId:string){
 const stmts=[
  env.DB.prepare("UPDATE courtesy_grants SET status='revoked' WHERE id=? AND status='active'").bind(grantId),
  env.DB.prepare("UPDATE courtesy_download_tokens SET revoked_at=CURRENT_TIMESTAMP WHERE grant_id=? AND revoked_at IS NULL").bind(grantId),
 ];
 const results=await env.DB.batch(stmts);
 if((results[0].meta?.changes||0)===0)return json({error:"Cortesia não encontrada ou já revogada"},404);
 await audit(env,actor,"courtesy_revoked",grantId);
 return json({status:"revoked"});
}
export async function getCourtesies(env:Env,id:string){
 const results=await env.DB.prepare("SELECT g.id,g.status,g.expires_at,g.reason,p.id AS product_id,p.title,p.price_cents FROM courtesy_grants g JOIN products p ON p.id=g.product_id WHERE g.customer_id=? ORDER BY g.created_at DESC LIMIT 100").bind(id).all();
 return json({courtesies:results.results});
}
async function issueAction(env:Env,actor:string,id:string,action:"password_reset"|"email_change",candidate?:string){
 const recipient=await customer(env,id);
 if(!recipient||recipient.status!=="active")return json({error:"Aluno inexistente"},404);
 if(!mailReady(env))return json({error:"Configure Resend antes de usar esta função"},503);
 const to=action==="email_change"?candidate!:recipient.email;
 const recent=await env.DB.prepare("SELECT COUNT(*) AS n FROM customer_action_tokens WHERE customer_id=? AND action=? AND created_at>datetime('now','-5 minutes')").bind(id,action).first<{n:number}>();
 if((recent?.n||0)>0)return json({error:"Aguarde cinco minutos antes de reenviar"},429);
 const token=newSecret(),hash=await secretHash(token),expiry=now()+3600;
 await env.DB.prepare("INSERT INTO customer_action_tokens(token_hash,customer_id,action,pending_email,expires_at) VALUES(?,?,?,?,?)")
  .bind(hash,id,action,action==="email_change"?to:null,expiry).run();
 const link=(env.PUBLIC_BASE_URL||"").replace(/\/$/,"")+"/confirmar?acao="+action+"&token="+token;
 const success=await send(env,to,action==="email_change"?"Confirme seu novo e-mail — ATPCursos":"Crie ou redefina sua senha — ATPCursos",
  action==="email_change"?"Confirme a alteração do e-mail por este link (válido por uma hora): "+link:
  "Acesse para criar ou redefinir sua senha de acesso aos materiais ATPCursos (válido por uma hora): "+link);
 if(!success){await env.DB.prepare("DELETE FROM customer_action_tokens WHERE token_hash=?").bind(hash).run();return json({error:"E-mail não enviado; confira configuração Resend"},503);}
 await audit(env,actor,action==="email_change"?"email_change_requested":"password_reset_requested",id);
 return json({ok:true,confirmationRequired:true,expiresInMinutes:60});
}
export async function changeEmailRequest(req:Request,env:Env,actor:string,id:string){
 const b=await readJSON(req);const newEmail=normalizeEmail(clean(b.newEmail,254));
 if(!validEmail(newEmail))return json({error:"Novo e-mail inválido"},422);
 const existing=await env.DB.prepare("SELECT id FROM customers WHERE email=? COLLATE NOCASE").bind(newEmail).first();
 if(existing)return json({error:"E-mail já utilizado"},409);
 return issueAction(env,actor,id,"email_change",newEmail);
}
export async function passwordResetRequest(env:Env,actor:string,id:string){
 return issueAction(env,actor,id,"password_reset");
}
