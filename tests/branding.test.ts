import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import worker from "../src/index";

const root=process.cwd();
const file=(path:string)=>join(root,"public",path);
const width=(buffer:Buffer)=>buffer.readUInt32BE(16);
const height=(buffer:Buffer)=>buffer.readUInt32BE(20);
test("PWA manifest references real icons, including maskable",()=>{
 const m=JSON.parse(readFileSync(file("manifest.webmanifest"),"utf8"));
 assert.equal(m.name,"ATPCursos — PDFs para concursos");
 assert.equal(m.start_url,"/loja");
 assert.equal(m.display,"standalone");
 assert.ok(m.icons.some((i:{purpose:string})=>i.purpose==="maskable"));
 for(const icon of m.icons){
  const local=file(icon.src.replace(/^\//,""));
  assert.ok(existsSync(local),"Missing "+local);
  const data=readFileSync(local);
  assert.equal(data.subarray(1,4).toString("ascii"),"PNG");
  const n=Number(icon.sizes.split("x")[0]);
  assert.equal(width(data),n);
  assert.equal(height(data),n);
 }
});
test("logo, favicons and OG share preview exist",()=>{
 for(const p of ["brand/logo-atp.png","brand/favicon.ico","brand/favicon-32.png","brand/apple-touch-icon.png","brand/og-atpcursos.jpg","sw.js"]){
  assert.ok(existsSync(file(p)),p+" missing");
 }
 const apple=readFileSync(file("brand/apple-touch-icon.png"));
 assert.equal(width(apple),180);
 const og=readFileSync(file("brand/og-atpcursos.jpg"));
 assert.equal(og[0],0xff);assert.equal(og[1],0xd8);
});
test("all important app HTML pages reference real logo and absolute social URLs",async()=>{
 for(const p of ["/loja","/produto/material-teste","/meus-materiais"]){
  const r=await worker.fetch(new Request("https://atpcursos.example"+p),{} as any,{} as any);
  const html=await r.text();
  assert.equal(r.status,200);
  assert.match(html,/\/brand\/logo-atp\.png/);
  assert.match(html,/\/manifest\.webmanifest/);
  assert.match(html,/\/brand\/favicon\.ico/);
  assert.match(html,/https:\/\/atpcursos\.example\/brand\/og-atpcursos\.jpg/);
  assert.match(html,/<meta property="og:url" content="https:\/\/atpcursos\.example/);
  assert.ok(!html.includes('▲</span> ATP'));
 }
});
test("PWA service worker cannot cache PDFs, orders or admin routes",()=>{
 const js=readFileSync(file("sw.js"),"utf8");
 assert.match(js,/isPublicAsset/);
 assert.match(js,/if\(!isPublicAsset\(p\)\)return/);
 assert.ok(!js.includes("cache.put(req"));
 assert.match(js,/try\{return await fetchFresh\}catch/);
});
test("amber logo preserves original source privately and regenerates all sharing assets",()=>{
 const source=join(root,"assets","brand","logo-atp-original.png");
 assert.ok(existsSync(source),"the original emblem must remain recoverable");
 assert.ok(!existsSync(file("brand/logo-atp-original.png")),"the original should not be publicly exposed");
 assert.notDeepEqual(readFileSync(source),readFileSync(file("brand/logo-atp.png")),"the premium logo should be recolored");
 const manifest=JSON.parse(readFileSync(file("manifest.webmanifest"),"utf8"));
 assert.equal(manifest.theme_color,"#171512");
 assert.equal(manifest.background_color,"#F8F3EA");
 const workerScript=readFileSync(file("sw.js"),"utf8");
 assert.match(workerScript,/atpcursos-public-amber-v2/,"service worker must expire old logo cache");
 for(const path of ["brand/logo-atp.png","brand/favicon-16.png","brand/favicon-32.png","brand/favicon-48.png","brand/icon-192.png","brand/icon-512.png","brand/icon-512-maskable.png"]){
  const image=readFileSync(file(path));
  assert.equal(image.subarray(1,4).toString("ascii"),"PNG");
 }
});
