import { Env, json } from "./infra";

type PublicProduct={
 id:string;slug:string;title:string;category:string;discipline:string|null;
 contest:string|null;description:string|null;price_cents:number;file_count:number;page_count:number|null;
};
const sharedSql=`
 SELECT p.id,p.slug,p.title,p.category,p.discipline,p.contest,p.description,p.price_cents,
  COUNT(f.id) AS file_count,
  CASE WHEN COUNT(f.id)>0 AND SUM(CASE WHEN f.page_count>0 THEN 1 ELSE 0 END)=COUNT(f.id)
   THEN SUM(f.page_count) ELSE NULL END AS page_count
 FROM products p LEFT JOIN product_files f ON f.product_id=p.id
`;
export async function listPublishedProducts(env:Env){
 const products=await env.DB.prepare(sharedSql+`
 WHERE p.status='published' GROUP BY p.id ORDER BY p.created_at DESC,p.id DESC LIMIT 100
 `).all<PublicProduct>();
 return json({products:products.results});
}
export async function getPublishedProduct(env:Env,slug:string){
 const product=await env.DB.prepare(sharedSql+`
 WHERE p.slug=? AND p.status='published' GROUP BY p.id
 `).bind(slug).first<PublicProduct>();
 if(!product)return json({error:"Produto não encontrado"},404);
 // Public metadata only: never return original_key, R2 paths or unpublished files.
 const files=await env.DB.prepare(`
 SELECT title,CASE WHEN page_count>0 THEN page_count ELSE NULL END AS page_count
 FROM product_files WHERE product_id=? ORDER BY position,created_at,id LIMIT 20
 `).bind(product.id).all<{title:string;page_count:number|null}>();
 return json({product,files:files.results});
}
