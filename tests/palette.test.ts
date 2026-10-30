import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { premiumStyles } from "../src/design";
import { adminPage,adminImport,storefront } from "../src/ui";
import { customerMaterialsPage } from "../src/admin-customers-ui";
import { salesPage } from "../src/sales-pages";

const rgb=(s:string)=>s.replace("#","").match(/../g)!.map(x=>parseInt(x,16)/255);
const lum=(s:string)=>rgb(s).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const ratio=(a:string,b:string)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);

test("atpconcursos permanent colors are shared across seven storefront/admin/student screens",()=>{
 for(const html of [storefront(),adminPage(),adminImport(),customerMaterialsPage(),...([1,2,3,4].map(salesPage))]){
  assert.match(html,/--brand-primary:#153F59/);
  assert.match(html,/--brand-secondary:#245F7A/);
  assert.match(html,/--brand-accent:#F17950/);
  assert.match(html,/--brand-page:#F5F6F2/);
  assert.match(html,/theme-color" content="#153F59"/);
 }
 assert.match(premiumStyles,/prefers-reduced-motion/);
 assert.match(premiumStyles,/:focus-visible/);
});
test("coral CTA and dark-blue links meet WCAG AA for normal text",()=>{
 assert.ok(ratio("#1B252D","#F17950")>=4.5);
 assert.ok(ratio("#245F7A","#FFFFFF")>=4.5);
 assert.ok(ratio("#DFEBF2","#153F59")>=4.5);
});
test("PWA manifest uses the official atpconcursos palette",()=>{
 const m=JSON.parse(readFileSync("public/manifest.webmanifest","utf8"));
 assert.equal(m.theme_color,"#153F59");
 assert.equal(m.background_color,"#F5F6F2");
});
