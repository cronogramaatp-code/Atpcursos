import { Env,emailHash,json,plain } from "./infra";

type PurchaseRow={
 order_id:string; order_status:string; created_at:string; total_cents:number;
 title_snapshot:string; file_title:string; kind:string;
 delivery_id:string|null; delivery_status:string|null; personalized_key:string|null;
};
export type CustomerPurchase={
 id:string;status:string;createdAt:string;totalCents:number;
 files:{id:string|null;title:string;kind:"bundle"|"legacy";status:string;downloadable:boolean}[];
};
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listCustomerPurchases(env:Env,customerId:string,verifiedEmail:string):Promise<CustomerPurchase[]>{
 if(!env.BUYER_HASH_KEY)throw Error("Buyer hash binding missing");
 const hash=await emailHash(verifiedEmail,env.BUYER_HASH_KEY);
 const rows=await env.DB.prepare(`
  SELECT o.id AS order_id,o.status AS order_status,o.created_at,o.total_cents,
   i.title_snapshot,
   COALESCE(f.title_snapshot,i.title_snapshot) AS file_title,
   CASE WHEN f.id IS NULL THEN 'legacy' ELSE 'bundle' END AS kind,
   CASE WHEN f.id IS NULL THEN d.id ELSE bd.id END AS delivery_id,
   CASE WHEN f.id IS NULL THEN d.status ELSE bd.status END AS delivery_status,
   CASE WHEN f.id IS NULL THEN d.personalized_key ELSE bd.personalized_key END AS personalized_key
  FROM (
   SELECT id,status,created_at,total_cents
   FROM orders o
   LEFT JOIN customer_order_links owner ON owner.order_id=o.id
   WHERE owner.customer_id=? OR (owner.order_id IS NULL AND o.buyer_email_hash=?)
   ORDER BY o.created_at DESC,o.id DESC LIMIT 30
  ) o
  JOIN order_items i ON i.order_id=o.id
  LEFT JOIN order_item_files f ON f.order_item_id=i.id
  LEFT JOIN bundle_deliveries bd ON bd.order_item_file_id=f.id
  LEFT JOIN deliveries d ON d.order_item_id=i.id AND f.id IS NULL
  ORDER BY o.created_at DESC,o.id DESC,i.id,f.position,f.id
 `).bind(customerId,hash).all<PurchaseRow>();
 const orders:CustomerPurchase[]=[];
 const byId=new Map<string,CustomerPurchase>();
 for(const row of rows.results){
  let order=byId.get(row.order_id);
  if(!order){
   order={id:row.order_id,status:row.order_status,createdAt:row.created_at,totalCents:row.total_cents,files:[]};
   byId.set(order.id,order);orders.push(order);
  }
  const kind=row.kind==="bundle"?"bundle":"legacy";
  order.files.push({
   id:row.delivery_id,
   title:row.file_title,
   kind,
   status:row.delivery_status??"pending",
   downloadable:!!row.delivery_id&&!!row.personalized_key&&
    (row.delivery_status==="ready"||row.delivery_status==="sent")&&
    (row.order_status==="paid"||row.order_status==="delivered")
  });
 }
 return orders;
}
export async function downloadPurchasedFile(env:Env,customerId:string,verifiedEmail:string,kind:string,id:string):Promise<Response>{
 if(!env.BUYER_HASH_KEY)return json({error:"Acesso temporariamente indisponível"},503);
 if(!idPattern.test(id)||(kind!=="bundle"&&kind!=="legacy"))return plain("Arquivo indisponível",403);
 const buyerHash=await emailHash(verifiedEmail,env.BUYER_HASH_KEY);
 const query=kind==="bundle"
  ? `SELECT d.personalized_key FROM bundle_deliveries d JOIN orders o ON o.id=d.order_id
     LEFT JOIN customer_order_links owner ON owner.order_id=o.id
     WHERE d.id=? AND (owner.customer_id=? OR (owner.order_id IS NULL AND o.buyer_email_hash=?))
     AND o.status IN ('paid','delivered')
     AND d.status IN ('ready','sent') AND d.personalized_key IS NOT NULL`
  : `SELECT d.personalized_key FROM deliveries d JOIN orders o ON o.id=d.order_id
     LEFT JOIN customer_order_links owner ON owner.order_id=o.id
     WHERE d.id=? AND (owner.customer_id=? OR (owner.order_id IS NULL AND o.buyer_email_hash=?))
     AND o.status IN ('paid','delivered')
     AND d.status='sent' AND d.personalized_key IS NOT NULL`;
 const rec=await env.DB.prepare(query).bind(id,customerId,buyerHash).first<{personalized_key:string}>();
 if(!rec)return plain("Arquivo não autorizado",403);
 const file=await env.PDFS.get(rec.personalized_key);
 if(!file)return plain("Arquivo temporariamente indisponível",503);
 return new Response(file.body,{headers:{
  "content-type":"application/pdf",
  "content-disposition":"attachment; filename=atpconcursos-personalizado.pdf",
  "cache-control":"private, no-store",
  "referrer-policy":"no-referrer",
  "x-content-type-options":"nosniff"
 }});
}
