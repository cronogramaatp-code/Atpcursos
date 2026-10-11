import { Env } from "./infra";

export type Analytics = {
 period: string; timezone: string;
 funnel: { checkouts: number; paidEver: number; conversionPercent: number; refunded: number; pending: number };
 buyerCohort: { uniqueBuyers: number; repeatBuyers: number; repeatRatePercent: number };
 fulfillment: { sent: number; pending: number; processing: number; error: number; revoked: number };
 dailySales: { day: string; orders: number; revenueCents: number }[];
 topProducts: { title: string; category: string; units: number; grossBeforeDiscountCents: number }[];
 byCategory: { category: string; units: number }[];
 discountBands: { percent: number; orders: number; totalDiscountCents: number }[];
};

export function rate(part: number,total: number){
 if(!Number.isFinite(part)||!Number.isFinite(total)||total<=0)return 0;
 return Math.min(100,Math.max(0,Math.round(part/total*10000)/100));
}
const int=(n:unknown)=>Number.isFinite(Number(n))?Number(n):0;
export async function analytics(env:Env): Promise<Analytics>{
 const [funnel,buyers,delivery,sales,leaders,categories,discounts]=await Promise.all([
  env.DB.prepare(`SELECT COUNT(*) AS checkout_count,
   SUM(CASE WHEN status IN('paid','delivered','refunded') THEN 1 ELSE 0 END) AS ever_paid,
   SUM(CASE WHEN status='refunded' THEN 1 ELSE 0 END) AS refunds,
   SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending
   FROM orders`).first<{checkout_count:number;ever_paid:number;refunds:number;pending:number}>(),
  env.DB.prepare(`SELECT COUNT(*) AS unique_count,
   SUM(CASE WHEN n>=2 THEN 1 ELSE 0 END) AS repeat_count
   FROM (SELECT buyer_email_hash,COUNT(*) AS n FROM orders
   WHERE status IN ('paid','delivered','refunded') GROUP BY buyer_email_hash)`)
   .first<{unique_count:number;repeat_count:number}>(),
  env.DB.prepare("SELECT status,COUNT(*) AS n FROM deliveries GROUP BY status")
   .all<{status:string;n:number}>(),
  env.DB.prepare(`SELECT date(paid_at,'-3 hours') AS day,COUNT(*) AS orders,
   SUM(total_cents) AS revenue_cents FROM orders
   WHERE status IN ('paid','delivered') AND paid_at >= datetime('now','-31 days')
   GROUP BY date(paid_at,'-3 hours') ORDER BY day ASC`)
   .all<{day:string;orders:number;revenue_cents:number}>(),
  env.DB.prepare(`SELECT i.title_snapshot AS title,p.category AS category,
   COUNT(*) AS units,SUM(i.price_snapshot_cents) AS gross_before_discount
   FROM order_items i JOIN orders o ON o.id=i.order_id
   JOIN products p ON p.id=i.product_id
   WHERE o.status IN ('paid','delivered')
   GROUP BY i.product_id,i.title_snapshot,p.category
   ORDER BY units DESC,gross_before_discount DESC LIMIT 12`)
   .all<{title:string;category:string;units:number;gross_before_discount:number}>(),
  env.DB.prepare(`SELECT p.category AS category,COUNT(*) AS units
   FROM order_items i JOIN orders o ON o.id=i.order_id
   JOIN products p ON p.id=i.product_id
   WHERE o.status IN ('paid','delivered')
   GROUP BY p.category ORDER BY units DESC`)
   .all<{category:string;units:number}>(),
  env.DB.prepare(`SELECT discount_rate AS percent,COUNT(*) AS orders,
   SUM(discount_cents) AS discounts FROM orders WHERE status IN ('paid','delivered')
   GROUP BY discount_rate ORDER BY discount_rate`)
   .all<{percent:number;orders:number;discounts:number}>()
 ]);
 const checkoutCount=int(funnel?.checkout_count),paidCount=int(funnel?.ever_paid);
 const uniqueBuyers=int(buyers?.unique_count),repeatBuyers=int(buyers?.repeat_count);
 const deliveryMap=Object.fromEntries(delivery.results.map(d=>[d.status,int(d.n)]));
 return {
  period:"Historico de pedidos; serie diaria de ate 31 dias",
  timezone:"America/Sao_Paulo (UTC-3 para exibicao diaria)",
  funnel:{checkouts:checkoutCount,paidEver:paidCount,conversionPercent:rate(paidCount,checkoutCount),
   refunded:int(funnel?.refunds),pending:int(funnel?.pending)},
  buyerCohort:{uniqueBuyers,repeatBuyers,repeatRatePercent:rate(repeatBuyers,uniqueBuyers)},
  fulfillment:{sent:deliveryMap.sent||0,pending:deliveryMap.pending||0,processing:deliveryMap.processing||0,
   error:deliveryMap.error||0,revoked:deliveryMap.revoked||0},
  dailySales:sales.results.map(r=>({day:r.day,orders:int(r.orders),revenueCents:int(r.revenue_cents)})),
  topProducts:leaders.results.map(r=>({title:r.title,category:r.category,units:int(r.units),
   grossBeforeDiscountCents:int(r.gross_before_discount)})),
  byCategory:categories.results.map(r=>({category:r.category,units:int(r.units)})),
  discountBands:discounts.results.map(r=>({percent:int(r.percent),orders:int(r.orders),totalDiscountCents:int(r.discounts)}))
 };
}
