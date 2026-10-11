import test from "node:test";
import assert from "node:assert/strict";
import { quotePrice, loyaltyPercent } from "../src/domain/pricing";
const a = { id:"a", priceCents:10000 }, b = { id:"b", priceCents:5000 };
test("loyalty increases by order, capped at 50%", () => {
  assert.deepEqual([0,1,2,3,4,5,50].map(loyaltyPercent),[0,20,30,40,50,50,50]);
});
test("first purchase full price; second gets 20%",()=>{
  assert.equal(quotePrice([a],0).totalCents,10000);
  assert.equal(quotePrice([a],1).totalCents,8000);
});
test("upsell 10%, no stacking with loyalty",()=>{
  assert.equal(quotePrice([a,b],0).totalCents,13500);
  assert.equal(quotePrice([a,b],1).totalCents,12000);
  assert.equal(quotePrice([a,b],99).totalCents,7500);
});
test("invalid count, duplicate products, tampered prices rejected",()=>{
  assert.throws(()=>loyaltyPercent(-1));
  assert.throws(()=>quotePrice([a,a],0));
  assert.throws(()=>quotePrice([{id:"x",priceCents:1}],0));
  assert.throws(()=>quotePrice([a],NaN));
});
test("discount never > 50% even in odd cent scenarios",()=>{
  for(let n=101;n<112;n++) {
    const q=quotePrice([{id:"a",priceCents:n}],100);
    assert.ok(q.discountCents <= Math.floor(n/2));
  }
});
