import { Env, emailOK } from "./infra";

export interface ConfirmedSale {
 id:string; total_cents:number; discount_cents:number; status:string;
}
export function saleAlertText(order:ConfirmedSale):string {
 if(!/^[a-f0-9-]{36}$/i.test(order.id) ||
    !Number.isSafeInteger(order.total_cents) || order.total_cents<100 ||
    !Number.isSafeInteger(order.discount_cents) || order.discount_cents<0 ||
    order.discount_cents>order.total_cents ||
    !["paid","delivered"].includes(order.status))throw Error("INVALID_CONFIRMED_SALE");
 const brl=(cents:number)=>(cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 return [
  "ATPCursos — nova venda confirmada.",
  "Pedido: "+order.id,
  "Valor confirmado: "+brl(order.total_cents),
  "Desconto concedido: "+brl(order.discount_cents),
  "Status de pagamento: confirmado pela InfinitePay.",
  "Confira os detalhes e a entrega no painel administrativo."
 ].join("\n");
}

/** Called only for provider-verified paid orders. Claim is database-atomic and retryable. */
export async function notifyConfirmedSale(env:Env,orderId:string):Promise<boolean>{
 if(!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !env.DB)return false;
 const recipient=await env.DB.prepare("SELECT value FROM store_settings WHERE key='sales_alert_to'")
  .first<{value:string}>();
 const to=recipient?.value?.trim().toLowerCase()||"";
 if(!emailOK(to))return false;
 const order=await env.DB.prepare(
  "SELECT id,total_cents,discount_cents,status FROM orders WHERE id=? AND status IN ('paid','delivered')"
 ).bind(orderId).first<ConfirmedSale>();
 if(!order)return false;
 const message=saleAlertText(order);
 await env.DB.prepare(
  "INSERT OR IGNORE INTO sale_alerts(order_id,status) VALUES(?,'pending')"
 ).bind(order.id).run();
 const claimed=await env.DB.prepare(
  "UPDATE sale_alerts SET status='processing',attempts=attempts+1,updated_at=CURRENT_TIMESTAMP "+
  "WHERE order_id=? AND (status IN ('pending','error') OR "+
  "(status='processing' AND updated_at<datetime('now','-10 minutes')))"
 ).bind(order.id).run();
 if((claimed.meta?.changes||0)!==1)return false;
 try {
  const response=await fetch("https://api.resend.com/emails",{
   method:"POST",
   headers:{"authorization":"Bearer "+env.RESEND_API_KEY,
    "content-type":"application/json",
    "Idempotency-Key":"atpcursos-sale-"+order.id},
   body:JSON.stringify({from:env.RESEND_FROM_EMAIL,to:[to],
    subject:"ATPCursos — venda confirmada",text:message})
  });
  if(!response.ok)throw Error("PROVIDER_SEND_FAILED");
  await env.DB.prepare(
   "UPDATE sale_alerts SET status='sent',sent_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE order_id=?"
  ).bind(order.id).run();
  return true;
 }catch{
  await env.DB.prepare(
   "UPDATE sale_alerts SET status='error',updated_at=CURRENT_TIMESTAMP WHERE order_id=?"
  ).bind(order.id).run();
  return false;
 }
}
