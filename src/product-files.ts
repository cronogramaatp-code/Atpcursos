import { PDFDocument } from "pdf-lib";
import { Env, json, uuid } from "./infra";

export const MAX_PDF_BYTES=50*1024*1024;
export const MAX_PRODUCT_FILES=20;
export const MAX_PRODUCT_BYTES=300*1024*1024;

export function safeFileTitle(value:string):string {
 const s=value.replace(/[<>:"/\\|?*\x00-\x1f]/g," ").replace(/\s+/g," ").trim();
 return s.slice(0,140)||"Material PDF";
}
export function pdfEnvelopeOK(header:string,tail:string):boolean {
 return header.startsWith("%PDF-")&&tail.includes("%%EOF");
}
type FileRow={id:string;title:string;original_key:string;page_count:number;size_bytes:number;position:number};

export async function productFiles(env:Env,productId:string){
 const files=await env.DB.prepare("SELECT id,title,page_count,size_bytes,position FROM product_files WHERE product_id=? ORDER BY position,created_at,id")
 .bind(productId).all();
 return json({files:files.results,maxFileBytes:MAX_PDF_BYTES,maxProductFiles:MAX_PRODUCT_FILES,maxProductBytes:MAX_PRODUCT_BYTES});
}

/** Private streaming upload: never buffer 50MB requests in Workers memory. */
export async function appendProductPDF(req:Request,env:Env,productId:string){
 if(!req.headers.get("content-type")?.toLowerCase().startsWith("application/pdf"))
  return json({error:"Envie um PDF (application/pdf)"},415);
 const headerLength=req.headers.get("content-length");
 const length=headerLength===null?NaN:Number(headerLength);
 if(!Number.isSafeInteger(length)||length<24||length>MAX_PDF_BYTES)
  return json({error:"PDF deve ter entre 24 bytes e 50 MB; Content-Length é obrigatório"},413);
 if(!req.body)return json({error:"PDF ausente"},422);
 const product=await env.DB.prepare("SELECT status FROM products WHERE id=?")
 .bind(productId).first<{status:string}>();
 if(!product||product.status!=="draft")return json({error:"Produto inexistente ou não está em rascunho"},409);
 const existing=await env.DB.prepare("SELECT COUNT(*) AS n,COALESCE(SUM(size_bytes),0) AS bytes FROM product_files WHERE product_id=?")
 .bind(productId).first<{n:number;bytes:number}>();
 if((existing?.n||0)>=MAX_PRODUCT_FILES)return json({error:"Limite de 20 PDFs por produto"},409);
 if((existing?.bytes||0)+length>MAX_PRODUCT_BYTES)return json({error:"Limite de 300 MB por produto"},413);
 const url=new URL(req.url);
 const title=safeFileTitle(url.searchParams.get("name")||"Material PDF");
 const id=uuid(),key="originals/"+productId+"/"+id+".pdf";
 let written=false;
 try{
  const obj=await env.PDFS.put(key,req.body,{httpMetadata:{contentType:"application/pdf"}});
  written=true;
  if(!obj||obj.size!==length)throw Error("UPLOAD_SIZE_MISMATCH");
  const first=await env.PDFS.get(key,{range:{offset:0,length:8}});
  const last=await env.PDFS.get(key,{range:{suffix:2048}});
  if(!first||!last||!pdfEnvelopeOK(await first.text(),await last.text()))
   throw Error("INVALID_PDF_ENVELOPE");
  // Parse smaller PDFs; large files remain at zero pages until independently reviewed.
  let pages=0;
  if(length<=12*1024*1024){
   const pdf=await env.PDFS.get(key);
   if(!pdf)throw Error("UPLOAD_NOT_READABLE");
   const doc=await PDFDocument.load(await pdf.arrayBuffer(),{ignoreEncryption:false});
   pages=doc.getPageCount();
   if(pages<1||pages>2000)throw Error("INVALID_PDF_PAGES");
  }
  const pos=existing?.n||0;
  await env.DB.prepare("INSERT INTO product_files(id,product_id,title,original_key,page_count,size_bytes,position) VALUES(?,?,?,?,?,?,?)")
   .bind(id,productId,title,key,pages,length,pos).run();
  await env.DB.prepare("UPDATE products SET original_key=COALESCE(original_key,?),page_count=(SELECT COALESCE(SUM(page_count),0) FROM product_files WHERE product_id=?),updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='draft'")
   .bind(key,productId,productId).run();
  return json({id,title,pages,bytes:length,status:"draft"},201);
 }catch(e){
  if(written)await env.PDFS.delete(key).catch(()=>{});
  return json({error:e instanceof Error&&e.message==="INVALID_PDF_ENVELOPE"?"Arquivo não parece ser um PDF válido":"Não foi possível validar/importar o PDF"},422);
 }
}

export async function removeProductPDF(env:Env,productId:string,fileId:string){
 const product=await env.DB.prepare("SELECT status FROM products WHERE id=?")
  .bind(productId).first<{status:string}>();
 if(!product||product.status!=="draft")return json({error:"Apenas rascunhos podem ser editados"},409);
 const f=await env.DB.prepare("SELECT original_key FROM product_files WHERE id=? AND product_id=?")
  .bind(fileId,productId).first<{original_key:string}>();
 if(!f)return json({error:"PDF não encontrado"},404);
 await env.DB.prepare("DELETE FROM product_files WHERE id=? AND product_id=?")
  .bind(fileId,productId).run();
 await env.DB.prepare("UPDATE products SET original_key=(SELECT original_key FROM product_files WHERE product_id=? ORDER BY position,created_at,id LIMIT 1), page_count=(SELECT COALESCE(SUM(page_count),0) FROM product_files WHERE product_id=?),updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='draft'")
  .bind(productId,productId,productId).run();
 await env.PDFS.delete(f.original_key);
 return json({deleted:true});
}
