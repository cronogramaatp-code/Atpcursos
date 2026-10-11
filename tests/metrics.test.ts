import test from "node:test";
import assert from "node:assert/strict";
import { summarizeOrders } from "../src/domain/metrics";
test("metrics reflect ONLY verified paid/delivered orders minus refunds",()=>{
 const r=summarizeOrders([
 {status:"paid",total_cents:8000,discount_cents:2000,created_at:"2026-10-11",paid_at:"2026-10-11T14:00:00Z"},
 {status:"delivered",total_cents:3000,discount_cents:0,created_at:"2026-10-10",paid_at:"2026-10-10T11:00:00Z"},
 {status:"refunded",total_cents:2000,discount_cents:0,created_at:"2026-10-10",paid_at:"2026-10-10T11:00:00Z"},
 {status:"pending",total_cents:9999,discount_cents:0,created_at:"2026-10-11"}
 ],"2026-10-11");
 assert.deepEqual([r.grossCents,r.refundsCents,r.netCents,r.ordersToday,r.pendingOrders,r.averageTicketCents],[13000,2000,11000,1,1,5500]);
});
