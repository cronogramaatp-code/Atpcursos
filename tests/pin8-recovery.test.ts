import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/index";

test("students can request PIN recovery without revealing whether their e-mail exists",async()=>{
 const outgoing:string[]=[];
 const sent:string[]=[];
 const tokens:string[]=[];
 const queries:{sql:string;args:unknown[]}[]=[];
 const original=globalThis.fetch;
 const env:any={
  DB:{prepare(sql:string){let args:unknown[]=[];const statement={
   bind(...next:unknown[]){args=next;return statement;},
   async first(){queries.push({sql,args});
    if(sql.includes("FROM customers WHERE email=?"))return args[0]==="registered@example.com"?{id:"registered-user"}:null;
    if(sql.includes("FROM customers WHERE id=?"))return {id:"registered-user",email:"registered@example.com",full_name:"Registered Student",status:"active"};
    if(sql.includes("COUNT(*) AS n FROM customer_action_tokens"))return {n:tokens.length};
    throw Error("Unexpected query: "+sql);
   },
   async run(){queries.push({sql,args});if(sql.includes("INSERT INTO customer_action_tokens"))tokens.push(String(args[0]));return {meta:{changes:1}};}
  };return statement;}},
  PDFS:{},BUYER_HASH_KEY:"buyer-only-test-key",PIN_PEPPER:"student-secure-pepper-at-least-32-chars",
  PUBLIC_BASE_URL:"https://staging-atpconcursos.example",
  RESEND_API_KEY:"resend-test-not-real",RESEND_FROM_EMAIL:"loja@example.com"
 };
 globalThis.fetch=async(_url,options)=>{
  const body=JSON.parse(String(options?.body)) as {to:string[]};
  sent.push(body.to[0]);
  return new Response(null,{status:202});
 };
 const ask=(email:string)=>app.fetch(new Request("https://staging-atpconcursos.example/api/customer/request-reset",{
  method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})
 }),env,{} as any);
 try {
  const known=await ask(" REGISTERED@example.com ");
  const unknown=await ask("unknown@example.com");
  assert.equal(known.status,200);
  assert.equal(unknown.status,200);
  assert.deepEqual(await known.json(),await unknown.json());
  assert.deepEqual(sent,["registered@example.com"]);
  assert.equal(tokens.length,1);
  const again=await ask("registered@example.com");
  assert.equal(again.status,200);
  assert.deepEqual(sent,["registered@example.com"]);
  const invalid=await ask("not-an-email");
  assert.equal(invalid.status,422);
 }finally{globalThis.fetch=original;}
});
