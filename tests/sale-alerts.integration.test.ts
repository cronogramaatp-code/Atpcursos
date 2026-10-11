import test from "node:test";
import assert from "node:assert/strict";
import {notifyConfirmedSale} from "../src/sale-alerts";
import type {Env} from "../src/infra";

const order={
 id:"88888888-8888-4888-8888-888888888888",
 total_cents:9800,discount_cents:2200,status:"paid"
};
function fixture(verified:boolean, recipient=true){
 const state:{status:string|null;attempts:number}={status:null,attempts:0};
 const DB={
  prepare(sql:string){
   let values:unknown[]=[];
   return {
    bind(...v:unknown[]){values=v;return this},
    async first(){
     if(sql.includes("store_settings"))return recipient?{value:"thayna25nunes@gmail.com"}:null;
     if(sql.includes("FROM orders"))return verified?order:null;
     return null;
    },
    async run(){
     if(sql.startsWith("INSERT OR IGNORE INTO sale_alerts")){
      if(state.status===null){state.status="pending";return{meta:{changes:1}}}
      return{meta:{changes:0}};
     }
     if(sql.includes("SET status='processing'")){
      if(["pending","error"].includes(state.status||"")){
       state.status="processing";state.attempts++;return{meta:{changes:1}}
      }
      return{meta:{changes:0}};
     }
     if(sql.includes("SET status='sent'")){state.status="sent";return{meta:{changes:1}}}
     if(sql.includes("SET status='error'")){state.status="error";return{meta:{changes:1}}}
     throw new Error("Unexpected SQL "+sql);
    }
   };
  }
 };
 const env={DB,RESEND_API_KEY:"test-only-key",RESEND_FROM_EMAIL:"ATPCursos <teste@example.org>"} as unknown as Env;
 return{env,state};
}
test("verified order sends one notification even after repeated webhook",async()=>{
 const {env,state}=fixture(true);
 let sends=0;
 const old=globalThis.fetch;
 globalThis.fetch=async(url,opts)=>{
  sends++;
  assert.equal(String(url),"https://api.resend.com/emails");
  const data=JSON.parse(String(opts?.body));
  assert.deepEqual(data.to,["thayna25nunes@gmail.com"]);
  assert.match(data.text,/R\$\s?98,00/);
  assert.equal((opts?.headers as Record<string,string>)["Idempotency-Key"],"atpcursos-sale-"+order.id);
  return new Response('{"id":"fake"}',{status:200});
 };
 try {
  assert.equal(await notifyConfirmedSale(env,order.id),true);
  assert.equal(await notifyConfirmedSale(env,order.id),false);
  assert.equal(sends,1);
  assert.equal(state.status,"sent");
  assert.equal(state.attempts,1);
 }finally{globalThis.fetch=old}
});
test("pending payment or missing recipient can never generate a notification",async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async()=>{throw new Error("Unexpected mail send")};
 try {
  assert.equal(await notifyConfirmedSale(fixture(false).env,order.id),false);
  assert.equal(await notifyConfirmedSale(fixture(true,false).env,order.id),false);
 }finally{globalThis.fetch=old}
});
test("failed provider delivery stays retryable, then records successful alert",async()=>{
 const {env,state}=fixture(true);
 const old=globalThis.fetch;let attempts=0;
 globalThis.fetch=async()=>{
  attempts++;
  return new Response("{}",{status:attempts===1?502:200});
 };
 try{
  assert.equal(await notifyConfirmedSale(env,order.id),false);
  assert.equal(state.status,"error");
  assert.equal(await notifyConfirmedSale(env,order.id),true);
  assert.equal(state.status,"sent");
  assert.equal(state.attempts,2);
 }finally{globalThis.fetch=old}
});
