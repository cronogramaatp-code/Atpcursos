import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pinState, pinRequest, pinEnroll, pinLogin, pinLogout, hasAdminPin } from "../src/admin-pin";

const authorized="admin@example.com";
const other="other@example.com";
function setup() {
 const sqlite=new DatabaseSync(":memory:");
 sqlite.exec(readFileSync(new URL("../migrations/0006_admin_pin.sql",import.meta.url),"utf8"));
 const wrap=(sql:string)=>{
  const stmt=sqlite.prepare(sql);let params:any[]=[];
  const w={
   bind(...args:any[]){params=args;return w;},
   async first(){return stmt.get(...params);},
   async all(){return {results:stmt.all(...params)};},
   async run(){const r=stmt.run(...params);return {meta:{changes:r.changes}};}
  };
  return w;
 };
 const env={PIN_PEPPER:"atp-admin-pepper-test-at-least-32-characters",
  RESEND_API_KEY:"test-only",RESEND_FROM_EMAIL:"atp@example.com",
  PUBLIC_BASE_URL:"https://staging-atpconcursos.example",
  DB:{prepare:wrap,async batch(stmts:any[]){sqlite.exec("BEGIN");try{const results=[];for(const s of stmts)results.push(await s.run());sqlite.exec("COMMIT");return results;}catch(err){sqlite.exec("ROLLBACK");throw err;}}}
 } as any;
 const req=(body:unknown)=>new Request("https://staging-atpconcursos.example/api/admin/pin/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
 return {sqlite,env,req};
}
test("admin is denied without an enrolled PIN and session even when identity is supplied",async()=>{
 const {sqlite,env,req}=setup();
 try {
  assert.equal(await hasAdminPin(req({}),env,authorized),false);
  const s=await pinState(env,authorized);
  assert.equal(s.status,200);
  assert.equal((await s.json() as {enrolled:boolean}).enrolled,false);
 } finally {sqlite.close();}
});
test("admin enrollment requires valid one-time email token and eight-digit PIN",async()=>{
 const {sqlite,env,req}=setup();
 let message="";
 const original=globalThis.fetch;
 globalThis.fetch=async(_url,options)=>{message=(JSON.parse(String(options?.body)) as {text:string}).text;return new Response(null,{status:202});};
 try {
  const sent=await pinRequest(env,authorized);
  assert.equal(sent.status,200);
  const found=message.match(/pin_token=([0-9a-f]{64})/);
  assert.ok(found);
  const invalid=await pinEnroll(req({token:found[1],pin:"abcdefgh"}),env,authorized);
  assert.equal(invalid.status,422);
  const wrong=await pinEnroll(req({token:"0".repeat(64),pin:"00001234"}),env,authorized);
  assert.equal(wrong.status,403);
  const enrolled=await pinEnroll(req({token:found[1],pin:"00001234"}),env,authorized);
  assert.equal(enrolled.status,200);
  const cookie=enrolled.headers.get("set-cookie")||"";
  assert.match(cookie,/Secure; HttpOnly; SameSite=Strict/);
  const authReq=new Request("https://staging-atpconcursos.example/api/admin/products",{headers:{"cookie":cookie.split(";")[0]}});
  assert.equal(await hasAdminPin(authReq,env,authorized),true);
  assert.equal(await hasAdminPin(authReq,env,other),false);
  assert.equal((await pinEnroll(req({token:found[1],pin:"00001234"}),env,authorized)).status,403);
  const out=await pinLogout(authReq,env,authorized);
  assert.equal(out.status,200);
  assert.equal(await hasAdminPin(authReq,env,authorized),false);
 }finally{globalThis.fetch=original;sqlite.close();}
});
test("admin login limits failures and permits valid eight-number PIN",async()=>{
 const {sqlite,env,req}=setup();
 const original=globalThis.fetch;
 let message="";
 globalThis.fetch=async(_url,options)=>{message=(JSON.parse(String(options?.body)) as {text:string}).text;return new Response(null,{status:202});};
 try{
  await pinRequest(env,authorized);
  const token=message.match(/pin_token=([0-9a-f]{64})/)![1];
  const enrolled=await pinEnroll(req({token,pin:"00001234"}),env,authorized);
  assert.equal(enrolled.status,200);
  for(let i=0;i<5;i++)assert.equal((await pinLogin(req({pin:"00001235"}),env,authorized)).status,401);
  assert.equal((await pinLogin(req({pin:"00001234"}),env,authorized)).status,429);
 }finally{globalThis.fetch=original;sqlite.close();}
});
test("administrator PIN fails closed when server pepper is missing",async()=>{
 const {sqlite,env,req}=setup();
 try{delete env.PIN_PEPPER;assert.equal((await pinLogin(req({pin:"00001234"}),env,authorized)).status,503);}finally{sqlite.close();}
});
