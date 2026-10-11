import test from "node:test";
import assert from "node:assert/strict";
import {saleAlertText} from "../src/sale-alerts";

const sale={id:"88888888-8888-4888-8888-888888888888",total_cents:9800,discount_cents:2200,status:"paid"};
test("sale notice shows confirmed amount and discount, without customer private data",()=>{
 const msg=saleAlertText(sale);
 assert.match(msg,/nova venda confirmada/i);
 assert.match(msg,/R\$\s?98,00/);
 assert.match(msg,/R\$\s?22,00/);
 assert.ok(msg.includes(sale.id));
 assert.ok(!msg.includes("buyer_email"));
});
test("pending or refunded orders must never generate sales notices",()=>{
 for(const status of ["pending","refunded","checkout_failed"]){
  assert.throws(()=>saleAlertText({...sale,status}),/INVALID_CONFIRMED_SALE/);
 }
});
test("invalid monetary values are rejected",()=>{
 for(const cost of [-1,0,99,NaN,Infinity,1.2]){
  assert.throws(()=>saleAlertText({...sale,total_cents:cost}),/INVALID_CONFIRMED_SALE/);
 }
 assert.throws(()=>saleAlertText({...sale,discount_cents:10000}),/INVALID_CONFIRMED_SALE/);
});
