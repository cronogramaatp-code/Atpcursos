import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { validPassword, passwordHash, passwordMatch, newSecret, secretHash } from "../src/domain/customer";
import { login, applyAction } from "../src/customer-public";
import { emailHash } from "../src/infra";

const pepper="student-test-secret-kept-server-side";
const email="estudante@example.com";

function setup() {
 const sqlite=new DatabaseSync(":memory:");
 sqlite.exec(`
 CREATE TABLE customers (
  id TEXT PRIMARY KEY, email TEXT, status TEXT DEFAULT 'active',
  password_salt TEXT, password_digest TEXT, password_iterations INTEGER, updated_at TEXT,
  full_name TEXT DEFAULT 'Estudante ATP');
 CREATE TABLE customer_login_limits(email_hash TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE customer_sessions(token_hash TEXT PRIMARY KEY, customer_id TEXT, expires_at INTEGER, revoked_at TEXT);
 CREATE TABLE customer_action_tokens(token_hash TEXT PRIMARY KEY, customer_id TEXT, action TEXT, pending_email TEXT, used_at TEXT, expires_at INTEGER);
 CREATE TABLE audit_logs(id TEXT PRIMARY KEY, action TEXT, actor TEXT, target TEXT);
 `);
 const wrap=(sql:string)=>{
  let params: unknown[]=[];
  const statement=sqlite.prepare(sql);
  const w={
   bind(...args:unknown[]){params=args;return w;},
   async run(){const r=statement.run(...(params as any[]));return {meta:{changes:r.changes}};},
   async first(){return statement.get(...(params as any[]));},
   async all(){return {results:statement.all(...(params as any[]))};}
  };
  return w;
 };
 const env={
  DB:{prepare:wrap,async batch(stmts:any[]){sqlite.exec("BEGIN");try{const results=[];for(const s of stmts)results.push(await s.run());sqlite.exec("COMMIT");return results;}catch(e){sqlite.exec("ROLLBACK");throw e;}}},
  BUYER_HASH_KEY:"test-hmac-buyer-key",PIN_PEPPER:pepper
 } as any;
 return {sqlite,env};
}
const request=(path:string,body:unknown)=>new Request("https://staging-atpconcursos.example"+path,{
 method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)
});

test("PIN requires exactly 8 decimal characters and preserves leading zeros",()=>{
 for(const good of ["00001234","12345678","99999999"])assert.equal(validPassword(good),true);
 for(const bad of ["1234567","123456789","01234abc","12 34567","１２３４５６７８","abcdefgh",""])assert.equal(validPassword(bad),false,bad);
});

test("server-peppered PIN hash validates only with original pepper and pin",async()=>{
 const hash=await passwordHash("00001234",pepper);
 assert.equal(hash.iterations,310000);
 assert.equal(await passwordMatch("00001234",hash.salt,hash.digest,hash.iterations,pepper),true);
 assert.equal(await passwordMatch("00001235",hash.salt,hash.digest,hash.iterations,pepper),false);
 assert.equal(await passwordMatch("00001234",hash.salt,hash.digest,hash.iterations,"other-pepper"),false);
 await assert.rejects(()=>passwordHash("password12345",pepper));
});

test("student login requires a valid numeric PIN and is throttled",async()=>{
 const {sqlite,env}=setup();
 try{
  const cred=await passwordHash("00001234",pepper);
  sqlite.prepare("INSERT INTO customers(id,email,status,password_salt,password_digest,password_iterations) VALUES(?,?,?,?,?,?)")
   .run("c-1",email,"active",cred.salt,cred.digest,cred.iterations);
  const ok=await login(request("/api/customer/login",{email,password:"00001234"}),env);
  assert.equal(ok.status,200);
  assert.match(ok.headers.get("set-cookie")||"",/HttpOnly; Secure; SameSite=Strict/);
  for(let i=0;i<5;i++){
   const fail=await login(request("/api/customer/login",{email,password:"99999999"}),env);
   assert.equal(fail.status,401);
  }
  const blocked=await login(request("/api/customer/login",{email,password:"99999999"}),env);
  assert.equal(blocked.status,429);
 }finally{sqlite.close();}
});

test("student cannot login when server-side PIN pepper is not configured",async()=>{
 const {sqlite,env}=setup();
 try{delete env.PIN_PEPPER;const res=await login(request("/api/customer/login",{email,password:"00001234"}),env);assert.equal(res.status,503);}finally{sqlite.close();}
});

test("verified reset link creates 8-digit PIN and revokes old sessions",async()=>{
 const {sqlite,env}=setup();
 try{
  const token=newSecret(),hash=await secretHash(token);
  sqlite.prepare("INSERT INTO customers(id,email,status) VALUES(?,?,?)").run("c-2",email,"active");
  sqlite.prepare("INSERT INTO customer_sessions(token_hash,customer_id,expires_at) VALUES(?,?,?)").run("session","c-2",2100000000);
  sqlite.prepare("INSERT INTO customer_action_tokens(token_hash,customer_id,action,expires_at) VALUES(?,?,?,?)").run(hash,"c-2","password_reset",2100000000);
  const invalid=await applyAction(request("/api/customer/action/password_reset",{token,password:"password-not-pin"}),env,"password_reset");
  assert.equal(invalid.status,422);
  const ok=await applyAction(request("/api/customer/action/password_reset",{token,password:"00001234"}),env,"password_reset");
  assert.equal(ok.status,200);
  const record=sqlite.prepare("SELECT password_salt,password_digest,password_iterations FROM customers WHERE id=?").get("c-2") as any;
  assert.equal(await passwordMatch("00001234",record.password_salt,record.password_digest,record.password_iterations,pepper),true);
  assert.notEqual((sqlite.prepare("SELECT revoked_at FROM customer_sessions WHERE customer_id=?").get("c-2") as any).revoked_at,null);
  assert.equal((await applyAction(request("/api/customer/action/password_reset",{token,password:"00001234"}),env,"password_reset")).status,403);
 }finally{sqlite.close();}
});
