import { Env,json,readJSON,emailHash,now } from "./infra";
import { validPassword,newSecret,secretHash,passwordHash,passwordMatch } from "./domain/customer";

const cookieName="__Host-atp_admin_pin";
const sessionSeconds=30*60;
const configOK=(env:Env)=>!!env.PIN_PEPPER && env.PIN_PEPPER.length>=32;
const userHash=(env:Env,email:string)=>emailHash(email,env.PIN_PEPPER!);
function cookie(req:Request) {
 const part=(req.headers.get("cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(cookieName+"="));
 return part?.slice(cookieName.length+1)||"";
}
function withSession(response:Response,token:string) {
 response.headers.set("set-cookie",cookieName+"="+token+"; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age="+sessionSeconds);
 return response;
}
function clearCookie(response:Response) {
 response.headers.set("set-cookie",cookieName+"=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0");
 return response;
}
async function newSession(env:Env,identity:string) {
 const raw=newSecret();
 await env.DB.prepare("INSERT INTO admin_pin_sessions(token_hash,identity_hash,expires_at) VALUES(?,?,?)")
 .bind(await secretHash(raw),identity,now()+sessionSeconds).run();
 return withSession(json({ok:true}),raw);
}
export async function hasAdminPin(req:Request,env:Env,email:string):Promise<boolean> {
 if(!configOK(env))return false;
 const raw=cookie(req);
 if(!/^[0-9a-f]{64}$/.test(raw))return false;
 const identity=await userHash(env,email);
 const row=await env.DB.prepare("SELECT token_hash FROM admin_pin_sessions WHERE token_hash=? AND identity_hash=? AND revoked_at IS NULL AND expires_at>?")
 .bind(await secretHash(raw),identity,now()).first<{token_hash:string}>();
 return !!row;
}
export async function pinState(env:Env,email:string) {
 if(!configOK(env))return json({error:"Configuração de autenticação pendente"},503);
 const identity=await userHash(env,email);
 const account=await env.DB.prepare("SELECT identity_hash FROM admin_pin_accounts WHERE identity_hash=?").bind(identity).first();
 return json({enrolled:!!account});
}
export async function pinRequest(env:Env,email:string) {
 if(!configOK(env)||!env.RESEND_API_KEY||!env.RESEND_FROM_EMAIL||!env.PUBLIC_BASE_URL)return json({error:"Envio de ativação indisponível"},503);
 const identity=await userHash(env,email);
 const recent=await env.DB.prepare("SELECT COUNT(*) AS n FROM admin_pin_tokens WHERE identity_hash=? AND created_at>datetime('now','-5 minutes')")
 .bind(identity).first<{n:number}>();
 if((recent?.n||0)>0)return json({error:"Aguarde cinco minutos antes de reenviar"},429);
 const token=newSecret(),tokenHash=await secretHash(token);
 await env.DB.prepare("INSERT INTO admin_pin_tokens(token_hash,identity_hash,expires_at) VALUES(?,?,?)")
 .bind(tokenHash,identity,now()+900).run();
 const base=env.PUBLIC_BASE_URL.replace(/\/$/,"");
 const message="Confirme o PIN do administrador do atpconcursos por este link válido por 15 minutos:\n"+base+"/adm?pin_token="+token+"\nSe não solicitou, ignore esta mensagem.";
 let sent=false;
 try {
  const r=await fetch("https://api.resend.com/emails",{
   method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+env.RESEND_API_KEY},
   body:JSON.stringify({from:env.RESEND_FROM_EMAIL,to:[email],subject:"atpconcursos — confirmar PIN administrativo",text:message})
  });
  sent=r.ok;
 }catch{}
 if(!sent){
  await env.DB.prepare("UPDATE admin_pin_tokens SET used_at=CURRENT_TIMESTAMP WHERE token_hash=?").bind(tokenHash).run();
  return json({error:"Não foi possível enviar a confirmação"},503);
 }
 return json({ok:true,checkEmail:true});
}
export async function pinEnroll(req:Request,env:Env,email:string) {
 if(!configOK(env))return json({error:"Configuração de PIN pendente"},503);
 const body=await readJSON(req,1024);
 const token=typeof body.token==="string"?body.token:"";
 const pin=typeof body.pin==="string"?body.pin:"";
 if(!validPassword(pin))return json({error:"O PIN deve ter exatamente oito números"},422);
 if(!/^[0-9a-f]{64}$/.test(token))return json({error:"Link inválido ou expirado"},403);
 const identity=await userHash(env,email),tokenHash=await secretHash(token);
 const consumed=await env.DB.prepare("UPDATE admin_pin_tokens SET used_at=CURRENT_TIMESTAMP WHERE token_hash=? AND identity_hash=? AND used_at IS NULL AND expires_at>?")
 .bind(tokenHash,identity,now()).run();
 if((consumed.meta?.changes||0)!==1)return json({error:"Link inválido ou expirado"},403);
 const cred=await passwordHash(pin,env.PIN_PEPPER!);
 await env.DB.batch([
  env.DB.prepare("INSERT INTO admin_pin_accounts(identity_hash,pin_salt,pin_digest,pin_iterations) VALUES(?,?,?,?) ON CONFLICT(identity_hash) DO UPDATE SET pin_salt=excluded.pin_salt,pin_digest=excluded.pin_digest,pin_iterations=excluded.pin_iterations,updated_at=CURRENT_TIMESTAMP")
   .bind(identity,cred.salt,cred.digest,cred.iterations),
  env.DB.prepare("UPDATE admin_pin_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE identity_hash=? AND revoked_at IS NULL").bind(identity),
  env.DB.prepare("DELETE FROM admin_pin_login_limits WHERE identity_hash=?").bind(identity)
 ]);
 return newSession(env,identity);
}
export async function pinLogin(req:Request,env:Env,email:string) {
 if(!configOK(env))return json({error:"Configuração de PIN pendente"},503);
 const body=await readJSON(req,512);
 const pin=typeof body.pin==="string"?body.pin:"";
 if(!validPassword(pin))return json({error:"PIN inválido"},401);
 const identity=await userHash(env,email),ts=now();
 await env.DB.prepare("INSERT INTO admin_pin_login_limits(identity_hash,window_start,attempts) VALUES(?,?,1) ON CONFLICT(identity_hash) DO UPDATE SET window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END,attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END")
 .bind(identity,ts,ts-900,ts-900).run();
 const limit=await env.DB.prepare("SELECT attempts FROM admin_pin_login_limits WHERE identity_hash=?").bind(identity).first<{attempts:number}>();
 if((limit?.attempts||0)>5)return json({error:"Muitas tentativas, aguarde 15 minutos"},429);
 const account=await env.DB.prepare("SELECT pin_salt,pin_digest,pin_iterations FROM admin_pin_accounts WHERE identity_hash=?").bind(identity)
 .first<{pin_salt:string;pin_digest:string;pin_iterations:number}>();
 if(!account||!(await passwordMatch(pin,account.pin_salt,account.pin_digest,account.pin_iterations,env.PIN_PEPPER!)))
  return json({error:"PIN inválido"},401);
 await env.DB.prepare("DELETE FROM admin_pin_login_limits WHERE identity_hash=?").bind(identity).run();
 return newSession(env,identity);
}
export async function pinLogout(req:Request,env:Env,email:string) {
 if(!configOK(env))return json({error:"Configuração de PIN pendente"},503);
 const raw=cookie(req);
 if(/^[0-9a-f]{64}$/.test(raw)) {
  await env.DB.prepare("UPDATE admin_pin_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=? AND identity_hash=? AND revoked_at IS NULL")
   .bind(await secretHash(raw),await userHash(env,email)).run();
 }
 return clearCookie(json({ok:true}));
}
