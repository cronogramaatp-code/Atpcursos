import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

export interface ProductionBindings {
  PROD_DB?: D1Database;
  PROD_PDFS?: R2Bucket;
  PRODUCTION_ADMIN_WRITES?: string;
}
type Result = { content: {type: "text";text: string}[]; isError?: boolean };
const output = (value:unknown):Result => ({content:[{type:"text",text:JSON.stringify(value)}]});
const error = (message:string):Result => ({content:[{type:"text",text:message}],isError:true});
const enabled = (env:ProductionBindings) => !!env.PROD_DB && !!env.PROD_PDFS;
const allowedWrite = (env:ProductionBindings) => enabled(env) && env.PRODUCTION_ADMIN_WRITES==="true";
async function audit(db:D1Database,actor:string,action:string,target:string) {
  await db.prepare("INSERT INTO audit_logs(id,action,actor,target) VALUES(?,?,?,?)")
    .bind(crypto.randomUUID(),action,actor,target).run();
}
const categories = ["Simulados","Mapas mentais","Resumões","Apostilas","Cronogramas","Combos"] as const;

export function registerProductionTools(server:McpServer,env:ProductionBindings,actor:string) {
  server.registerTool("production_status",{
    description:"Verificar o ambiente OFICIAL ATPCursos: banco D1 e armazenamento R2 de producao, independentes de staging. Somente leitura.",
    inputSchema:{}
  },async()=>{
    if(!enabled(env))return error("Bindings de producao indisponiveis");
    try{
      const result=await env.PROD_DB!.prepare("SELECT 1 AS ok").first<{ok:number}>();
      return output({environment:"production",official:true,d1:result?.ok===1,r2:!!env.PROD_PDFS,admin_writes_enabled:allowedWrite(env),payments:"nao alterados"});
    }catch{return error("Banco D1 de producao indisponivel");}
  });
  server.registerTool("production_sales_dashboard",{
    description:"Consultar indicadores financeiros REAIS do banco oficial de producao, sem alterar vendas.",
    inputSchema:{}
  },async()=>{
    if(!enabled(env))return error("Producao nao configurada");
    try{
      const financial=await env.PROD_DB!.prepare("SELECT COUNT(*) AS orders,SUM(CASE WHEN status IN ('paid','delivered') THEN 1 ELSE 0 END) AS paid_orders,SUM(CASE WHEN status IN ('paid','delivered') THEN total_cents ELSE 0 END) AS paid_cents,SUM(CASE WHEN status='refunded' THEN total_cents ELSE 0 END) AS refunded_cents,SUM(CASE WHEN status IN ('paid','delivered') THEN discount_cents ELSE 0 END) AS discounts_cents FROM orders").first();
      const active=await env.PROD_DB!.prepare("SELECT COUNT(*) AS active FROM presence WHERE last_seen_unix>?").bind(Math.floor(Date.now()/1000)-300).first();
      return output({environment:"production",financial,online:active,online_window_seconds:300,source:"official D1 orders"});
    }catch{return error("Dashboard oficial temporariamente indisponivel");}
  });
  server.registerTool("production_products_list",{
    description:"Listar PDFs, precos e status no catalogo de PRODuCAO oficial, nao staging.",
    inputSchema:{limit:z.number().int().min(1).max(100).default(30)}
  },async({limit})=>{
    if(!enabled(env))return error("Producao nao configurada");
    try{
      const q=await env.PROD_DB!.prepare("SELECT id,slug,title,category,contest,discipline,price_cents,status,page_count FROM products ORDER BY created_at DESC LIMIT ?").bind(limit).all();
      return output({environment:"production",products:q.results});
    }catch{return error("Catalogo oficial indisponivel");}
  });
  server.registerTool("production_orders_search",{
    description:"Consultar pedidos e compradores no D1 OFICIAL. Exige autenticacao owner; nao mistura homologacao.",
    inputSchema:{status:z.enum(["pending","paid","delivered","refunded","checkout_failed"]).optional(),limit:z.number().int().min(1).max(50).default(15)}
  },async({status,limit})=>{
    if(!enabled(env))return error("Producao nao configurada");
    try{
      const q=status?
        env.PROD_DB!.prepare("SELECT id,buyer_name,buyer_email,status,total_cents,discount_rate,paid_at FROM orders WHERE status=? ORDER BY created_at DESC LIMIT ?").bind(status,limit):
        env.PROD_DB!.prepare("SELECT id,buyer_name,buyer_email,status,total_cents,discount_rate,paid_at FROM orders ORDER BY created_at DESC LIMIT ?").bind(limit);
      const records=await q.all();
      return output({environment:"production",orders:records.results});
    }catch{return error("Consulta de pedidos oficiais indisponivel");}
  });
  server.registerTool("production_products_create",{
    description:"CRIAR rascunho na LOJA OFICIAL ATPCursos; requer confirmacao de producao. PDFs entram via importacao admin. Nunca ativa checkout.",
    inputSchema:{title:z.string().min(3).max(140),category:z.enum(categories),price_cents:z.number().int().min(100).max(20000000),confirm_production:z.literal(true)}
  },async({title,category,price_cents})=>{
    if(!allowedWrite(env))return error("Escrita na producao desabilitada");
    try{
      const id=crypto.randomUUID(),slug="material-"+id.slice(0,8);
      await env.PROD_DB!.prepare("INSERT INTO products(id,slug,title,category,price_cents,status) VALUES(?,?,?,?,?,'draft')").bind(id,slug,title,category,price_cents).run();
      await audit(env.PROD_DB!,actor,"mcp_production_product_create",id);
      return output({environment:"production",id,status:"draft",price_cents});
    }catch{return error("Cadastro oficial nao confirmado; revisar dados antes de repetir");}
  });
  server.registerTool("production_products_price_update",{
    description:"ALTERAR o preco de um PDF publicado/rascunho da loja OFICIAL, mantendo valores historicos dos pedidos pagos.",
    inputSchema:{id:z.string().uuid(),price_cents:z.number().int().min(100).max(20000000),confirm_production:z.literal(true)}
  },async({id,price_cents})=>{
    if(!allowedWrite(env))return error("Escrita na producao desabilitada");
    try{
      const r=await env.PROD_DB!.prepare("UPDATE products SET price_cents=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('draft','published')").bind(price_cents,id).run();
      if(r.meta?.changes!==1)return error("Produto oficial inexistente ou nao editavel");
      await audit(env.PROD_DB!,actor,"mcp_production_price_update",id);
      return output({environment:"production",id,price_cents,updated:true});
    }catch{return error("Preco oficial nao confirmado; revisar antes de repetir");}
  });
  server.registerTool("production_products_publish",{
    description:"PUBLICAR PDF na loja OFICIAL somente apos conferencia e comprovacao de autoria/licenca e presenca do original no R2 de producao.",
    inputSchema:{id:z.string().uuid(),copyright_checked:z.literal(true),confirm_production:z.literal(true)}
  },async({id})=>{
    if(!allowedWrite(env))return error("Escrita na producao desabilitada");
    try{
      const p=await env.PROD_DB!.prepare("SELECT original_key,status FROM products WHERE id=?").bind(id).first<{original_key:string|null;status:string}>();
      if(!p||p.status!=="draft"||!p.original_key||!await env.PROD_PDFS!.head(p.original_key))return error("PDF oficial nao importado ou revisao pendente");
      const r=await env.PROD_DB!.prepare("UPDATE products SET status='published',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='draft'").bind(id).run();
      if(r.meta?.changes!==1)return error("Publicacao nao confirmada");
      await audit(env.PROD_DB!,actor,"mcp_production_publish",id);
      return output({environment:"production",id,status:"published"});
    }catch{return error("Publicacao oficial nao confirmada; verificar antes de repetir");}
  });
  server.registerTool("production_products_unpublish",{
    description:"SUSPENDER novas vendas de um PDF na loja OFICIAL sem apagar historico nem arquivos de compradores.",
    inputSchema:{id:z.string().uuid(),confirm_production:z.literal(true)}
  },async({id})=>{
    if(!allowedWrite(env))return error("Escrita na producao desabilitada");
    try{
      const r=await env.PROD_DB!.prepare("UPDATE products SET status='draft',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='published'").bind(id).run();
      if(r.meta?.changes!==1)return error("Produto nao estava publicado");
      await audit(env.PROD_DB!,actor,"mcp_production_unpublish",id);
      return output({environment:"production",id,status:"draft"});
    }catch{return error("Suspensao nao confirmada");}
  });
  server.registerTool("production_delivery_retry",{
    description:"REENFILEIRAR entrega com erro de pedido ja PAGO da loja OFICIAL. Nao altera pagamento.",
    inputSchema:{order_id:z.string().uuid(),confirm_production:z.literal(true)}
  },async({order_id})=>{
    if(!allowedWrite(env))return error("Escrita na producao desabilitada");
    try{
      const valid=await env.PROD_DB!.prepare("SELECT id FROM orders WHERE id=? AND status IN ('paid','delivered')").bind(order_id).first();
      if(!valid)return error("Pedido oficial sem pagamento confirmado");
      const result=await env.PROD_DB!.prepare("UPDATE deliveries SET status='pending',updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND status='error'").bind(order_id).run();
      if(!result.meta?.changes)return error("Nenhuma entrega com erro");
      await audit(env.PROD_DB!,actor,"mcp_production_delivery_retry",order_id);
      return output({environment:"production",order_id,queued:result.meta.changes});
    }catch{return error("Reenvio de pedido oficial nao confirmado");}
  });
  server.registerTool("production_pdf_source_read",{
    description:"Ler o PDF ORIGINAL de um produto da loja OFICIAL pelo R2 de producao; nao acessa copias com marca d'agua do cliente. Limite 1,5 MB.",
    inputSchema:{product_id:z.string().uuid()}
  },async({product_id})=>{
    if(!enabled(env))return error("Producao nao configurada");
    try{
      const p=await env.PROD_DB!.prepare("SELECT original_key FROM products WHERE id=?").bind(product_id).first<{original_key:string|null}>();
      if(!p?.original_key)return error("Produto sem PDF original");
      const info=await env.PROD_PDFS!.head(p.original_key);
      if(!info||info.size>1500000)return error("PDF original nao encontrado ou maior que 1,5 MB; usar painel admin");
      const object=await env.PROD_PDFS!.get(p.original_key);
      if(!object)return error("Arquivo nao localizado");
      const bytes=new Uint8Array(await object.arrayBuffer());
      if(bytes.length<5||String.fromCharCode(...bytes.subarray(0,5))!=="%PDF-")return error("Original nao e um PDF valido");
      let binary="";
      for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
      return {content:[{type:"resource" as const,resource:{uri:"atpcursos://production/originals/"+product_id,mimeType:"application/pdf",blob:btoa(binary)}}]};
    }catch{return error("Falha na leitura do PDF oficial");}
  });
  server.registerTool("production_pdfs_catalog",{
    description:"Consultar documentos originais PDF da LOJA OFICIAL e conferir sua existencia no R2 de producao, sem abrir PDFs personalizados.",
    inputSchema:{limit:z.number().int().min(1).max(100).default(30)}
  },async({limit})=>{
    if(!enabled(env))return error("Producao nao configurada");
    try{
      const r=await env.PROD_DB!.prepare("SELECT id,title,status,original_key,page_count FROM products ORDER BY created_at DESC LIMIT ?").bind(limit).all<{id:string;title:string;status:string;original_key:string|null;page_count:number|null}>();
      const items=await Promise.all(r.results.map(async p=>({id:p.id,title:p.title,status:p.status,page_count:p.page_count,pdf_exists:p.original_key?!!await env.PROD_PDFS!.head(p.original_key):false})));
      return output({environment:"production",items});
    }catch{return error("Consulta de PDFs oficiais indisponivel");}
  });
}
