import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { premiumStyles } from "../src/design";
import { adminPage, adminImport, storefront } from "../src/ui";
import { customerMaterialsPage } from "../src/admin-customers-ui";
import { salesPage } from "../src/sales-pages";

const rgb=(hex:string):number[]=>hex.replace("#","").match(/../g)!.map(v=>parseInt(v,16)/255);
const lum=(hex:string):number=>rgb(hex).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const ratio=(a:string,b:string):number=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};

test("warm black orange and sand are shared by all seven storefronts and admin/student",()=>{
 for(const html of [storefront(),adminPage(),adminImport(),customerMaterialsPage(),...([1,2,3,4].map(salesPage))]){
  assert.match(html, /--coal:#171512/);
  assert.match(html, /--tangerine:#ee701e/);
  assert.match(html, /--sand:#f2c98d/);
  assert.match(html, /--oat:#f8f3ea/);
  assert.match(html, /theme-color" content="#171512"/);
  assert.doesNotMatch(html, /#0b1932|#2765e8|#123e7c/i);
 }
 assert.match(premiumStyles,/prefers-reduced-motion/);
 assert.match(premiumStyles,/:focus-visible/);
});
test("primary orange button text meets WCAG AA contrast",()=>{
 assert.ok(ratio("#171512","#ee701e")>=4.5,"dark text on orange must pass");
 assert.ok(ratio("#f3e2c5","#171512")>=4.5,"light text on charcoal must pass");
 assert.ok(ratio("#706659","#f8f3ea")>=4.5,"muted text on sand must pass");
});
test("PWA manifest uses the same charcoal and sand color scheme",()=>{
 const manifest=JSON.parse(readFileSync("public/manifest.webmanifest","utf8"));
 assert.equal(manifest.theme_color,"#171512");
 assert.equal(manifest.background_color,"#F8F3EA");
});