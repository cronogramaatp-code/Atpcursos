export type OrderLike = { status: string; total_cents: number; discount_cents: number; created_at: string; paid_at?: string | null };
export function summarizeOrders(orders: OrderLike[], todayISO: string) {
  const paid = orders.filter(o => o.status === "paid" || o.status === "delivered");
  const refunded = orders.filter(o => o.status === "refunded");
  const todayPaid = paid.filter(o => (o.paid_at || "").slice(0, 10) === todayISO);
  const sum = (v: OrderLike[], field: "total_cents"|"discount_cents") => v.reduce((a,x)=>a + x[field],0);
  const grossCents = sum(paid, "total_cents") + sum(refunded, "total_cents");
  const refundsCents = sum(refunded, "total_cents");
  const netCents = sum(paid, "total_cents");
  return { grossCents, refundsCents, netCents, paidOrders: paid.length, revenueTodayCents: sum(todayPaid,"total_cents"),
    ordersToday: todayPaid.length, averageTicketCents: paid.length ? Math.round(netCents/paid.length) : 0,
    discountGrantedCents: sum(paid,"discount_cents") + sum(refunded,"discount_cents"),
    pendingOrders:orders.filter(o=>o.status==="pending").length };
}
