import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import scheduler from "../src/reconciler-worker";

function env(){
 const sql:string[]=[];
 const db={prepare(query:string){
  sql.push(query);
  return {bind(..._x:unknown[]){return {async first(){return null;},async all(){return {results:[]};},async run(){return {meta:{changes:0}};}};},
   async all(){return {results:[]}}};
 }};
 return {sql,config:{
  ENVIRONMENT:"staging",RECONCILIATION_ENABLED:"true",
  DB:db,PDFS:{},ASSETS:{fetch:async()=>new Response("font")},INFINITEPAY_HANDLE:"test-handle",
  BUYER_HASH_KEY:"test-key",RESEND_API_KEY:"test-resend",RESEND_FROM_EMAIL:"no-reply@example.test",
  PUBLIC_BASE_URL:"https://atpcursos-staging.pages.dev"
 } as any};
}
const trigger={cron:"*/10 * * * *"} as any;
const ctx={waitUntil:(_promise:Promise<unknown>)=>{}} as any;

test("reconciliation worker rejects every HTTP request",async()=>{
 const {config}=env();
 const response=await scheduler.fetch(new Request("https://worker.example/api/checkout"),config,ctx);
 assert.equal(response.status,404);
 assert.equal(response.headers.get("cache-control"),"no-store");
});
test("worker stays disabled until the explicit configuration gate",async()=>{
 const {config,sql}=env();
 config.RECONCILIATION_ENABLED="false";
 await scheduler.scheduled(trigger,config,ctx);
 assert.equal(sql.length,0);
});
test("enabled worker rejects missing critical bindings or unrelated project domains",async()=>{
 const {config,sql}=env();
 delete config.INFINITEPAY_HANDLE;
 await assert.rejects(()=>scheduler.scheduled(trigger,config,ctx),/RECONCILER_MISCONFIGURED/);
 config.INFINITEPAY_HANDLE="test";
 config.PUBLIC_BASE_URL="https://cronogramaatp.com.br";
 await assert.rejects(()=>scheduler.scheduled(trigger,config,ctx),/RECONCILER_MISCONFIGURED/);
 assert.equal(sql.length,0);
});
test("correct staging environment runs reconciliation without activating checkout",async()=>{
 const {config,sql}=env();
 await scheduler.scheduled(trigger,config,ctx);
 assert.ok(sql.some(x=>x.includes("payment_events")));
 assert.ok(sql.some(x=>x.includes("orders")));
});
test("staging worker config is separate, cron-only, and never embeds secrets",()=>{
 const cfg=JSON.parse(readFileSync("wrangler.reconciler.staging.jsonc","utf8"));
 assert.equal(cfg.name,"atpconcursos-reconciler-staging");
 assert.equal(cfg.main,"src/reconciler-worker.ts");
 assert.equal(cfg.workers_dev,false);
 assert.equal(cfg.vars.RECONCILIATION_ENABLED,"false");
 assert.equal(cfg.vars.ENVIRONMENT,"staging");
 assert.deepEqual(cfg.triggers.crons,["*/10 * * * *"]);
 assert.equal(cfg.d1_databases[0].database_name,"atpcursos-staging-db");
 assert.equal(cfg.r2_buckets[0].bucket_name,"atpcursos-staging-pdfs");
 assert.equal(cfg.assets.binding,"ASSETS");
 const serialized=JSON.stringify(cfg);
 for(const secret of ["PIN_PEPPER","RESEND_API_KEY","BUYER_HASH_KEY","INFINITEPAY_HANDLE"])assert.ok(!serialized.includes(secret));
 assert.equal(cfg.routes,undefined);
 const workflow=readFileSync(".github/workflows/qa.yml","utf8");
 assert.match(workflow,/wrangler deploy --config wrangler\.reconciler\.staging\.jsonc --dry-run/);
 assert.match(workflow,/branches: \[feat\/spec-kit-loja-pdfs, main\]/);
});

test("staging cannot target the production host; production allows only the app domain",async()=>{
 const {config,sql}=env();
 config.PUBLIC_BASE_URL="https://atpconcursos.cronogramaatp.com.br";
 await assert.rejects(()=>scheduler.scheduled(trigger,config,ctx),/RECONCILER_MISCONFIGURED/);
 assert.equal(sql.length,0);
 config.ENVIRONMENT="production";
 await scheduler.scheduled(trigger,config,ctx);
 assert.ok(sql.some(x=>x.includes("payment_events")));
});

