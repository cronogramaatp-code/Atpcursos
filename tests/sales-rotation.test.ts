import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index";
import { offerVariant } from "../src/sales-pages";

const req=(path:string,cookie="")=>new Request("https://atpcursos.example"+path,{headers:cookie?{cookie}:{}});

test("four sales pages have different verified messages, shared identity and actual catalog",async()=>{
 const headings:string[]=[];
 for(let n=1;n<=4;n++){
  const res=await worker.fetch(req("/oferta-0"+n),{} as any,{} as any);
  assert.equal(res.status,200);
  const body=await res.text();
  assert.match(body,/ATPCursos/);
  assert.match(body,/id="results"/);
  assert.match(body,/id="q"/);
  assert.match(body,/id="tipo"/);
  assert.match(body,/href="#catalogo"/);
  assert.match(body,/brand\/logo-atp\.png/);
  assert.match(body,/--night:#171512/);
  assert.doesNotMatch(body,/compra agora com 90%|aprovacao garantida/i);
  headings.push((body.match(/<h1 id="offer-title">([^<]+)<\/h1>/)||[])[1]||"");
 }
 assert.equal(new Set(headings).size,4);
});
test("invalid offer path doesn't route to a sales page",async()=>{
 const res=await worker.fetch(req("/oferta-05"),{} as any,{} as any);
 assert.notEqual(res.status,200);
});
test("rotation is sticky by secure first-party cookie, no redirects to external sites",async()=>{
 const first=await worker.fetch(req("/ofertas"),{} as any,{} as any);
 assert.equal(first.status,302);
 const loc=first.headers.get("location")||"";
 const cookie=first.headers.get("set-cookie")||"";
 assert.match(loc,/^\/oferta-0[1-4]$/);
 assert.match(cookie,/^atp_oferta=0[1-4]/);
 assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);
 assert.match(first.headers.get("cache-control")||"",/no-store/);
 const second=await worker.fetch(req("/ofertas",cookie.split(";")[0]),{} as any,{} as any);
 assert.equal(second.headers.get("location"),loc);
});
test("offer cookie rejects invalid variants and is deterministic",()=>{
 assert.equal(offerVariant("atp_oferta=01",3),1);
 assert.equal(offerVariant("other=foo; atp_oferta=04",0),4);
 assert.equal(offerVariant("atp_oferta=05",0),1);
 assert.equal(offerVariant("",3),4);
});
test("the student's and admin's UI retain their functional mounts",async()=>{
 const home=await worker.fetch(req("/loja"),{} as any,{} as any);
 const page=await home.text();
 assert.match(page,/id="results"/);
 assert.match(page,/href="\/meus-materiais"/);
 assert.match(page,/href="\/ofertas"/);
 const student=await worker.fetch(req("/meus-materiais"),{} as any,{} as any);
 assert.equal(student.status,200);
 const html=await student.text();
 for(const id of ["login","email","password","account","files"])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/student-panel/);
});