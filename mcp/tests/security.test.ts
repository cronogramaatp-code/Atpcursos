import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index";
const ctx={} as ExecutionContext;
const env={DB:{},PDFS:{},ENVIRONMENT:"staging"} as any;
test("MCP refuses unauthenticated callers even with database bindings",async()=>{
 const r=await worker.fetch(new Request("https://mcp.test/mcp",{method:"POST"}),env,ctx);
 assert.equal(r.status,401);
 assert.match(r.headers.get("www-authenticate")||"","Bearer");
});
test("MCP refuses unrecognized path",async()=>{
 const r=await worker.fetch(new Request("https://mcp.test/admin/secret"),env,ctx);
 assert.equal(r.status,404);
});
test("MCP status reveals configuration only, no secrets",async()=>{
 const r=await worker.fetch(new Request("https://mcp.test/health"),env,ctx);
 assert.equal(r.status,200);
 const j=await r.json();
 assert.equal(j.app,"atpcursos-mcp");
 assert.equal(j.ready,false);
 assert.ok(!JSON.stringify(j).includes("token"));
});
test("MCP rejects invalid caller JWT",async()=>{
 const withAccess={...env,ACCESS_TEAM_DOMAIN:"https://atpcursos.cloudflareaccess.com",ACCESS_AUD:"test-audience",ADMIN_ALLOWED_EMAILS:"owner@example.org"} as any;
 const r=await worker.fetch(new Request("https://mcp.test/mcp",{method:"POST",headers:{"CF-Access-Jwt-Assertion":"malformed.jwt"}}),withAccess,ctx);
 assert.equal(r.status,401);
});
