import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

type AdminEnv = {
  DB: D1Database;
  PDFS: R2Bucket;
  GITHUB_TOKEN?: string;
  ENVIRONMENT?: string;
  ALLOW_PRODUCTION_DEPLOY?: string;
  PRODUCTION_PROJECT_READY?: string;
};
const REPO = "cronogramaatp-code/Atpcursos";
const FEATURE = "feat/spec-kit-loja-pdfs";
const ROOT = "https://api.github.com/repos/" + REPO;
const output = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }] });
const failure = (reason: string) => ({ content: [{ type: "text" as const, text: reason }], isError: true });
const permittedPath = (path: string) =>
  path.length <= 200 && !path.includes("..") && !path.includes("\\") &&
  /^(src|mcp|docs|specs|migrations|tools|tests|public|\.github\/workflows)\/[A-Za-z0-9_./-]+\.(?:ts|tsx|js|mjs|json|md|sql|css|yml|yaml|txt|html|svg)$/.test(path) &&
  !/(?:^|\/)(?:\.env|\.dev\.vars|secrets?|node_modules|dist|\.git)(?:[/.]|$)/i.test(path);
const headers = (env: AdminEnv): HeadersInit => ({
  "Accept": "application/vnd.github+json",
  "User-Agent": "ATPCursos-MCP",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(env.GITHUB_TOKEN ? {Authorization: "Bearer " + env.GITHUB_TOKEN} : {})
});
async function api(env: AdminEnv, path: string, init: RequestInit = {}) {
  return fetch(ROOT + path, { ...init, headers: {...headers(env), ...(init.headers || {})} });
}
async function audit(env: AdminEnv, actor: string, action: string, target: string) {
  await env.DB.prepare("INSERT INTO audit_logs(id,action,actor,target) VALUES(?,?,?,?)")
    .bind(crypto.randomUUID(), action, actor, target).run();
}
const encodeText = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i,i+16384));
  return btoa(binary);
};
const decodeText = (base64: string) => new TextDecoder().decode(
  Uint8Array.from(atob(base64.replace(/\s/g, "")), c => c.charCodeAt(0))
);
const branchPath = (branch: string) => branch === "main" ? "main" : FEATURE;

export function registerDeveloperTools(server: McpServer, env: AdminEnv, actor: string) {
  server.registerTool("developer_repo_list", {
    description: "Listar arquivos de codigo, documentos e scripts permitidos do repositorio ATPCursos, sem segredos",
    inputSchema: {branch:z.enum(["main", "feat/spec-kit-loja-pdfs"]).default(FEATURE), limit:z.number().int().min(1).max(200).default(80)}
  }, async ({branch, limit}) => {
    try {
      const r = await api(env, "/git/trees/" + encodeURIComponent(branchPath(branch)) + "?recursive=1");
      if (!r.ok) return failure("GitHub indisponivel para listagem");
      const d = await r.json() as {sha:string;tree:{path:string;type:string;size?:number}[];truncated?:boolean};
      return output({repository:REPO,branch,tree_sha:d.sha,files:d.tree.filter(x=>x.type==="blob"&&permittedPath(x.path)).slice(0,limit),truncated:!!d.truncated});
    } catch { return failure("Nao foi possivel listar os arquivos"); }
  });
  server.registerTool("developer_repo_read", {
    description: "Ler conteudo e SHA de arquivos permitidos do GitHub ATPCursos (main ou staging), nunca credenciais",
    inputSchema: {path:z.string().min(1).max(200),branch:z.enum(["main","feat/spec-kit-loja-pdfs"]).default(FEATURE)}
  }, async ({path,branch}) => {
    if (!permittedPath(path)) return failure("Caminho proibido");
    try {
      const r = await api(env, "/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(branch));
      if (!r.ok) return failure("Arquivo nao encontrado");
      const d = await r.json() as {type?:string;sha?:string;size?:number;encoding?:string;content?:string};
      if (d.type!=="file" || !d.content || d.encoding!=="base64" || (d.size||0)>80000) return failure("Formato nao permitido ou arquivo muito grande");
      return output({path,branch,sha:d.sha,content:decodeText(d.content)});
    } catch {return failure("Falha ao ler arquivo");}
  });
  server.registerTool("developer_repo_write", {
    description: "Criar ou editar arquivos permitidos no branch de desenvolvimento ATPCursos. Exige SHA esperado, registra auditoria; staging faz build e testes automaticos.",
    inputSchema: {path:z.string().min(1).max(200), content:z.string().max(80000), expected_sha:z.string().regex(/^[a-f0-9]{40}$/).optional(), message:z.string().min(12).max(140)}
  }, async ({path,content,expected_sha,message}) => {
    if (!env.GITHUB_TOKEN) return failure("Credencial GitHub de escrita nao configurada");
    if (!permittedPath(path) || path.startsWith("mcp/") || path.startsWith(".github/")) return failure("Arquivos do proprio servidor MCP e de workflows exigem revisao separada; nao editaveis pelo MCP");
    try {
      const endpoint="/contents/"+path.split("/").map(encodeURIComponent).join("/");
      const before=await api(env,endpoint+"?ref="+encodeURIComponent(FEATURE));
      if(before.status!==404 && !before.ok)return failure("Leitura de concorrencia falhou");
      const meta=before.ok?await before.json() as {sha:string;type:string}:null;
      if ((!!meta)!=(!!expected_sha) || (meta && (meta.type!=="file"||meta.sha!==expected_sha)))
        return failure("Versao do arquivo mudou ou criacao nao autorizada; atualize o SHA");
      const r=await api(env,endpoint,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,content:encodeText(content),branch:FEATURE,...(meta?{sha:meta.sha}:{})})});
      if(!r.ok)return failure("GitHub rejeitou edicao: "+r.status);
      const data=await r.json() as {commit?:{sha?:string};content?:{sha?:string}};
      await audit(env,actor,"mcp_repo_write",path+"@"+String(data.commit?.sha||"unknown").slice(0,12));
      return output({updated:true,path,branch:FEATURE,sha:data.content?.sha,commit:data.commit?.sha,ci:"automaticamente acionada para staging"});
    }catch{return failure("Escrita ou auditoria nao concluida; conferir GitHub antes de repetir");}
  });
  server.registerTool("developer_ci_status",{
    description:"Consultar workflow da loja e do MCP para o ultimo commit do branch de desenvolvimento",
    inputSchema:{}
  },async()=>{
    try{
      const headR=await api(env,"/git/ref/heads/"+FEATURE);
      if(!headR.ok)return failure("Branch staging indisponivel");
      const head=(await headR.json() as {object:{sha:string}}).object.sha;
      const runs=await api(env,"/actions/workflows/qa.yml/runs?head_sha="+head+"&per_page=5");
      if(!runs.ok)return failure("Nao foi possivel consultar CI");
      const data=await runs.json() as {workflow_runs:{id:number;status:string;conclusion:string|null;html_url:string}[]};
      return output({branch:FEATURE,commit:head,runs:data.workflow_runs.map(v=>({id:v.id,status:v.status,conclusion:v.conclusion,url:v.html_url}))});
    }catch{return failure("Falha na consulta da CI");}
  });
  server.registerTool("pdfs_catalog",{
    description:"Listar materiais e arquivos originais PDF no D1/R2 do ATPCursos (nao retorna PDFs personalizados de compradores)",
    inputSchema:{limit:z.number().int().min(1).max(100).default(30)}
  },async({limit})=>{
    try{
      const products=await env.DB.prepare("SELECT id,title,status,original_key,page_count FROM products ORDER BY created_at DESC LIMIT ?").bind(limit).all<{id:string;title:string;status:string;original_key:string|null;page_count:number|null}>();
      return output({items:await Promise.all(products.results.map(async x=>({id:x.id,title:x.title,status:x.status,page_count:x.page_count,has_pdf:!!x.original_key,pdf_exists:x.original_key?!!await env.PDFS.head(x.original_key):false})))});
    }catch{return failure("PDFs indisponiveis");}
  });
  server.registerTool("pdf_source_read",{
    description:"Ler um PDF original do catalogo, sem expor documentos personalizados nem outros buckets; limite 1,5 MB por arquivo",
    inputSchema:{product_id:z.string().uuid()}
  },async({product_id})=>{
    try{
      const p=await env.DB.prepare("SELECT original_key FROM products WHERE id=?").bind(product_id).first<{original_key:string|null}>();
      if(!p?.original_key)return failure("Original nao disponivel");
      const meta=await env.PDFS.head(p.original_key);
      if(!meta||meta.size>1500000)return failure("PDF inexistente ou maior que 1,5 MB; usar administracao do site");
      const obj=await env.PDFS.get(p.original_key);
      if(!obj)return failure("Original nao localizado");
      const b=await obj.arrayBuffer();
      const bytes=new Uint8Array(b);
      let binary="";for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
      return {content:[{type:"resource" as const,resource:{uri:"atpcursos://originals/"+product_id,mimeType:"application/pdf",blob:btoa(binary)}}]};
    }catch{return failure("Falha ao ler PDF original");}
  });
  server.registerTool("production_release",{
    description:"Publicar o commit staging testado na branch main de producao. Exige confirmacao explicita, duas jobs de CI PASS, alteracao fast-forward, aprovacao de deploy e trilha de auditoria. Nao ativa pagamentos.",
    inputSchema:{expected_sha:z.string().regex(/^[0-9a-f]{40}$/),confirmation:z.literal("PUBLICAR_ATPCURSOS_PRODUCAO")}
  },async({expected_sha})=>{
    if(env.ALLOW_PRODUCTION_DEPLOY!=="true"||env.PRODUCTION_PROJECT_READY!=="true")return failure("Publicacao nao habilitada no ambiente ou projeto de producao nao homologado");
    if(!env.GITHUB_TOKEN)return failure("GitHub token de escrita nao configurado");
    try{
      const r=await api(env,"/git/ref/heads/"+FEATURE);
      if(!r.ok)return failure("Nao foi possivel ler commit de staging");
      const sha=(await r.json() as {object:{sha:string}}).object.sha;
      if(sha!==expected_sha)return failure("Commit esperado difere do atual. Revisar antes de publicar");
      const compare=await api(env,"/compare/main..."+sha);
      if(!compare.ok)return failure("Comparacao entre main e staging falhou");
      const comparison=await compare.json() as {status:string;ahead_by:number;behind_by:number};
      if(comparison.status!=="ahead"||comparison.behind_by!==0)return failure("Branch divergiu da main: publicar via PR revisado, nunca force push");
      const ci=await api(env,"/actions/workflows/qa.yml/runs?head_sha="+sha+"&per_page=10");
      if(!ci.ok)return failure("A CI nao pode ser conferida");
      const recent=await ci.json() as {workflow_runs:{id:number;status:string;conclusion:string|null}[]};
      const valid=recent.workflow_runs.find(x=>x.status==="completed"&&x.conclusion==="success");
      if(!valid)return failure("CI nao concluiu com PASS para este commit");
      const jobsR=await api(env,"/actions/runs/"+valid.id+"/jobs?per_page=100");
      if(!jobsR.ok)return failure("Detalhes de jobs de CI indisponiveis");
      const jobs=(await jobsR.json() as {jobs:{name:string;conclusion:string|null}[]}).jobs;
      const required=["Loja / pagamentos / marca d'agua","MCP owner / autorizacao"];
      if(!required.every(label=>jobs.some(j=>j.name===label&&j.conclusion==="success")))return failure("Faltam jobs obrigatorios com PASS");
      await audit(env,actor,"mcp_release_requested",sha);
      const moved=await api(env,"/git/refs/heads/main",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({sha,force:false})});
      if(!moved.ok)return failure("GitHub bloqueou deploy: "+moved.status);
      await audit(env,actor,"mcp_release_main_fast_forward",sha);
      return output({main_updated:true,commit:sha,github_ci_run:valid.id,deploy:"projeto Pages de producao conectado a main iniciara build automatico",payments:"nao alterados",deployment_status:"verificar Cloudflare build/health"});
    }catch{return failure("Deploy nao confirmado. Verificar refs, CI e audit_logs antes de repetir");}
  });
}
