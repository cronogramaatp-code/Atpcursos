import test from "node:test";
import assert from "node:assert/strict";
import { registerDeveloperTools } from "../src/developer-tools";

function toolsFor(env: Record<string, unknown> = {}) {
  const callbacks = new Map<string, (input: any) => Promise<any>>();
  const fakeServer = {registerTool(name: string, _spec: unknown, callback: (input: any) => Promise<any>) {callbacks.set(name, callback);}};
  registerDeveloperTools(fakeServer as any, {DB:{} as any,PDFS:{} as any,...env}, "verified-owner@example.org");
  return callbacks;
}

test("new source, catalog and deployment tools are registered", () => {
  const tools = toolsFor();
  for (const n of ["developer_repo_list","developer_repo_read","developer_repo_write","developer_ci_status","pdfs_catalog","pdf_source_read","production_release"]) assert.ok(tools.has(n), n);
});
test("code writes are blocked without GitHub credential", async () => {
  const r = await toolsFor().get("developer_repo_write")!({path:"src/example.ts",content:"export const ok = true;",message:"Test controlled update"});
  assert.equal(r.isError, true);
  assert.match(r.content[0].text,/GitHub/i);
});
test("MCP itself and CI workflows cannot be overwritten via the MCP", async () => {
  for (const path of ["mcp/src/index.ts",".github/workflows/qa.yml"]) {
    const r = await toolsFor({GITHUB_TOKEN:"local-test-value"}).get("developer_repo_write")!({path,content:"malicious",message:"Never allow this write"});
    assert.equal(r.isError, true,path);
  }
});
test("production release fails closed before any GitHub API call", async () => {
  const r = await toolsFor({GITHUB_TOKEN:"local-test-value"}).get("production_release")!({expected_sha:"a".repeat(40),confirmation:"PUBLICAR_ATPCURSOS_PRODUCAO"});
  assert.equal(r.isError,true);
  assert.match(r.content[0].text,/nao habilitada/i);
});
