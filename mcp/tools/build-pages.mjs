import { build } from "esbuild";
import { mkdir, rm, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
const root = process.cwd();
const dist = resolve(root, "dist");
await rm(dist, {recursive: true, force: true});
await mkdir(dist, {recursive: true});
await writeFile(resolve(dist,"index.html"),"<!doctype html><html lang=\"pt-BR\"><meta charset=\"utf-8\"><title>ATPCursos MCP</title><body>ATPCursos MCP · Acesso autorizado</body></html>\n");
const outcome = await build({
 entryPoints:[resolve(root,"src/index.ts")],
 outfile:resolve(dist,"_worker.js"),
 bundle:true,platform:"browser",format:"esm",target:"es2022",
 conditions:["workerd","worker","browser"],external:["node:async_hooks"],minify:true,sourcemap:false,legalComments:"none",logLevel:"warning"
});
if(outcome.errors.length)process.exit(1);
console.log("ATPCURSOS_MCP_PAGES_BUILD_OK",(await stat(resolve(dist,"_worker.js"))).size);
