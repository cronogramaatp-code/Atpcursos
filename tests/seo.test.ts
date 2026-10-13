import test from "node:test";
import assert from "node:assert/strict";
import { seoRobots, seoSitemap } from "../src/seo";
import worker from "../src/index";

test("staging robots disallows all crawlers", async () => {
 const r=seoRobots({ENVIRONMENT:"staging"} as any);
 assert.equal(r.status,200);
 assert.match(await r.text(),/Disallow: \/$/m);
 assert.equal(r.headers.get("x-robots-tag"),"noindex, nofollow");
});
test("production robots links to production sitemap and hides private routes", async () => {
 const r=seoRobots({ENVIRONMENT:"production"} as any);
 const s=await r.text();
 assert.match(s,/Sitemap: https:\/\/atpcursos\.cronogramaatp\.com\.br\/sitemap\.xml/);
 assert.match(s,/Disallow: \/adm/);
 assert.match(s,/Disallow: \/api\//);
});
test("staging sitemap is unavailable", async () => {
 const r=await seoSitemap({ENVIRONMENT:"staging"} as any);
 assert.equal(r.status,404);
});
test("production sitemap includes only published slugs", async () => {
 const env={ENVIRONMENT:"production",DB:{prepare:(sql:string)=>{
  assert.match(sql,/status='published'/);
  return {all:async()=>({results:[{slug:"gcm-sp"},{slug:"matematica-2026"},{slug:"bad/slug"}]})};
 }}} as any;
 const r=await seoSitemap(env);
 assert.equal(r.status,200);
 assert.match(r.headers.get("content-type")||"",/application\/xml/);
 const xml=await r.text();
 assert.match(xml,/\/produto\/gcm-sp/);
 assert.match(xml,/\/produto\/matematica-2026/);
 assert.doesNotMatch(xml,/bad\/slug/);
 assert.doesNotMatch(xml,/\/adm/);
});
test("unconfigured product database returns 503", async () => {
 const r=await worker.fetch(new Request("https://atpcursos.example/produto/teste"),{} as any,{} as any);
 assert.equal(r.status,503);
});
