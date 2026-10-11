import test from "node:test";
import assert from "node:assert/strict";
import { registerProductionTools } from "../src/production-tools";

function setup(env:Record<string,unknown>={}){
 const tools = new Map<string,(input:any)=>Promise<any>>();
 const s={registerTool(name:string,_spec:unknown,cb:(input:any)=>Promise<any>){tools.set(name,cb)}};
 registerProductionTools(s as any,env as any,"owner@example.org");
 return tools;
}
test("production operations are explicitly distinct from staging",()=>{
 const t=setup();
 for(const n of ["production_status","production_sales_dashboard","production_products_list","production_orders_search","production_products_create","production_products_price_update","production_products_publish","production_products_unpublish","production_delivery_retry","production_pdf_source_read","production_pdfs_catalog"])assert.ok(t.has(n),n);
 assert.equal(t.has("products_create"),false);
});
test("absence of production bindings refuses any production operation",async()=>{
 const t=setup();
 for(const n of ["production_status","production_products_list","production_products_create","production_products_publish","production_delivery_retry"]){
  const result=await t.get(n)!({});
  assert.equal(result.isError,true,n);
 }
});
test("production writes are blocked even with D1/R2 unless explicitly enabled",async()=>{
 const t=setup({PROD_DB:{},PROD_PDFS:{}});
 for(const n of ["production_products_create","production_products_price_update","production_products_publish","production_products_unpublish","production_delivery_retry"]){
  const result=await t.get(n)!({});
  assert.equal(result.isError,true,n);
  assert.match(result.content[0].text,/desabilitada/i);
 }
});
test("production status checks only official database when bindings are available",async()=>{
 let selects=0;
 const db={prepare:(_sql:string)=>({first:async()=>{selects++;return{ok:1}}})};
 const t=setup({PROD_DB:db,PROD_PDFS:{},PRODUCTION_ADMIN_WRITES:"true"});
 const r=await t.get("production_status")!({});
 const data=JSON.parse(r.content[0].text);
 assert.equal(data.environment,"production");
 assert.equal(data.admin_writes_enabled,true);
 assert.equal(data.d1,true);
 assert.equal(selects,1);
});
