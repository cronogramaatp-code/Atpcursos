import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { premiumStyles } from "../src/design";
import { storefront,adminPage } from "../src/ui";
import { customerMaterialsPage } from "../src/admin-customers-ui";
import { salesPage } from "../src/sales-pages";

const colors=["#153F59","#245F7A","#DFEBF2","#F17950","#FFFFFF","#F5F6F2","#1B252D","#717A80","#E2E6E8","#EDF1F3"];
const rgb=(s:string)=>s.replace("#","").match(/../g)!.map(x=>parseInt(x,16)/255);
const lum=(s:string)=>rgb(s).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,b,i)=>a+b*[.2126,.7152,.0722][i],0);
const ratio=(a:string,b:string)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);

test("official atpconcursos theme contains every permanent color token",()=>{
 for(const color of colors)assert.ok(premiumStyles.includes(color),color);
 assert.match(premiumStyles,/--brand-primary:#153F59/);
 assert.match(premiumStyles,/--brand-accent:#F17950/);
 assert.match(premiumStyles,/\.btn\{background:var\(--brand-accent\);color:var\(--brand-ink\)/);
 assert.ok(ratio("#1B252D","#F17950")>=4.5);
 assert.ok(ratio("#245F7A","#FFFFFF")>=4.5);
 assert.match(premiumStyles,/prefers-reduced-motion/);
});

test("store, administration, student, and sales pages use the new commercial identity",()=>{
 for(const html of [storefront(),adminPage(),customerMaterialsPage(),salesPage(1)]){
  assert.match(html,/atpconcursos/i);
  assert.match(html,/application-name" content="atpconcursos"/);
  assert.match(html,/theme-color" content="#153F59"/);
  assert.match(html,/src="\/brand\/logo-atp.png"/);
  assert.match(html,/class="brand-text">atpconcursos/);
 }
});

test("PWA metadata uses the new identity and its light background",()=>{
 const m=JSON.parse(readFileSync("public/manifest.webmanifest","utf8"));
 assert.equal(m.name,"atpconcursos — PDFs para concursos");
 assert.equal(m.short_name,"atpconcursos");
 assert.equal(m.theme_color,"#153F59");
 assert.equal(m.background_color,"#F5F6F2");
});
