import test from "node:test";
import assert from "node:assert/strict";
import { createCheckout } from "../src/checkout";

test("real checkout stays disabled until explicit enablement even with payment credentials", async () => {
  const env = {ENVIRONMENT:"production",CHECKOUT_ENABLED:"false",INFINITEPAY_HANDLE:"test-handle",BUYER_HASH_KEY:"test-secret"} as any;
  const response = await createCheckout(new Request("https://atpcursos.example/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"Student",email:"buyer@example.org",productIds:[]})}),env);
  assert.equal(response.status,503);
});
