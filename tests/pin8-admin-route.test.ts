import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { SignJWT,generateKeyPair,exportJWK } from "jose";
import app from "../src/index";
import { pinRequest,pinEnroll } from "../src/admin-pin";

test("admin routes require validated Cloudflare Access AND a PIN session",async()=>{
 const db=new DatabaseSync(":memory:");
 db.exec(readFileSync(new URL("../migrations/0006_admin_pin.sql",import.meta.url),"utf8"));
 const prepare=(sql:string)=>{
  const s=db.prepare(sql);let b:any[]=[];
  const w={
   bind(...args:any[]){b=args;return w;},
   async run(){const result=s.run(...b);return {meta:{changes:result.changes}};},
   async first(){return s.get(...b);},
   async all(){return {results:s.all(...b)};}
  };return w;
 };
 const env={
  DB:{prepare,async batch(stmts:any[]){db.exec("BEGIN");try{const out=[];for(const x of stmts)out.push(await x.run());db.exec("COMMIT");return out;}catch(e){db.exec("ROLLBACK");throw e;}}},
  PDFS:{},ENVIRONMENT:"staging",
  PIN_PEPPER:"atp-admin-pepper-test-at-least-32-characters",
  PUBLIC_BASE_URL:"https://staging-atpconcursos.example",
  RESEND_API_KEY:"test-only",RESEND_FROM_EMAIL:"atp@example.com",
  ACCESS_TEAM_DOMAIN:"https://atp-test.cloudflareaccess.com",
  ACCESS_AUD:"atpconcursos-test-aud",ADMIN_ALLOWED_EMAILS:"admin@example.com"
 } as any;
 const original=globalThis.fetch;
 let mail="";
 const {publicKey,privateKey}=await generateKeyPair("RS256");
 const jwk={...(await exportJWK(publicKey)),alg:"RS256",use:"sig",kid:"pin8-test"};
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes("/cdn-cgi/access/certs"))return new Response(JSON.stringify({keys:[jwk]}),{status:200,headers:{"content-type":"application/json"}});
  if(String(url).includes("api.resend.com/emails")){mail=(JSON.parse(String(opts?.body)) as {text:string}).text;return new Response(null,{status:202});}
  throw Error("Unexpected outgoing request");
 };
 const token=await new SignJWT({email:"admin@example.com"}).setProtectedHeader({alg:"RS256",kid:"pin8-test"}).setIssuer(env.ACCESS_TEAM_DOMAIN).setAudience(env.ACCESS_AUD).setIssuedAt().setExpirationTime("10m").sign(privateKey);
 const request=(path:string,session="")=>new Request("https://staging-atpconcursos.example"+path,{headers:{"Cf-Access-Jwt-Assertion":token,...(session?{"cookie":session}:{})}});
 try{
  const noAccess=await app.fetch(new Request("https://staging-atpconcursos.example/adm"),env,{} as any);
  assert.equal(noAccess.status,403);
  const page=await app.fetch(request("/adm"),env,{} as any);
  assert.equal(page.status,200);
  const pinPage=await page.text();
  assert.match(pinPage,/Confirmar PIN do administrador/);
  assert.doesNotMatch(pinPage,/<script src="\/app.js"/);
  const blocked=await app.fetch(request("/api/admin/products"),env,{} as any);
  assert.equal(blocked.status,401);
  const crossOrigin=await app.fetch(new Request("https://staging-atpconcursos.example/api/admin/pin/request",{method:"POST",headers:{"Cf-Access-Jwt-Assertion":token,"Origin":"https://attacker.example"}}),env,{} as any);
  assert.equal(crossOrigin.status,403);
  const requested=await pinRequest(env,"admin@example.com");
  assert.equal(requested.status,200);
  const pinToken=mail.match(/pin_token=([a-f0-9]{64})/)![1];
  const enrollment=await pinEnroll(new Request("https://staging-atpconcursos.example/api/admin/pin/enroll",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pin:"00001234",token:pinToken})}),env,"admin@example.com");
  assert.equal(enrollment.status,200);
  const cookie=enrollment.headers.get("set-cookie")!.split(";")[0];
  const allowed=await app.fetch(request("/adm",cookie),env,{} as any);
  assert.equal(allowed.status,200);
  assert.match(await allowed.text(),/Central de gest/);
  const badIdentityToken=await new SignJWT({email:"notallowed@example.com"}).setProtectedHeader({alg:"RS256",kid:"pin8-test"}).setIssuer(env.ACCESS_TEAM_DOMAIN).setAudience(env.ACCESS_AUD).setIssuedAt().setExpirationTime("10m").sign(privateKey);
  const forbidden=await app.fetch(new Request("https://staging-atpconcursos.example/adm",{headers:{"Cf-Access-Jwt-Assertion":badIdentityToken,"cookie":cookie}}),env,{} as any);
  assert.equal(forbidden.status,403);
 } finally {globalThis.fetch=original;db.close();}
});
