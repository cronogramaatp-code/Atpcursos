import test from "node:test";
import assert from "node:assert/strict";
import {isTrustedCheckoutUrl, verifiedPaymentAmount} from "../src/domain/infinitepay";

test("accepts official Brazilian InfinitePay checkout URL",()=>{
 assert.equal(isTrustedCheckoutUrl("https://checkout.infinitepay.com.br/loja?lenc=foo"),true);
 assert.equal(isTrustedCheckoutUrl("https://checkout.infinitepay.io/loja?lenc=foo"),true);
 assert.equal(isTrustedCheckoutUrl("https://buy.infinitepay.io/produto"),true);
});
test("refuses lookalike checkouts and credentialed URLs",()=>{
 const bad=[
  "http://checkout.infinitepay.com.br/loja",
  "https://checkout.infinitepay.com.br.evil.tld/",
  "https://evil.tld/?checkout.infinitepay.com.br",
  "https://fake-infinitepay.io/",
  "https://infinitepay.io/",
  "https://attacker@checkout.infinitepay.com.br/",
  "https://checkout.infinitepay.com.br@evil.tld/",
  "javascript:alert(1)","not-a-url",
  "https://checkout.infinitepay.com.br:1234/"
 ];
 for(const url of bad)assert.equal(isTrustedCheckoutUrl(url),false,url);
});

test("confirms only paid server-checked amount (not paid_amount with fee)",()=>{
 assert.equal(verifiedPaymentAmount(
  {success:true,paid:true,amount:1500,paid_amount:1510},1500),true);
 for(const invalid of [
  {success:true,paid:false,amount:1500},
  {success:false,paid:true,amount:1500},
  {success:true,paid:true,amount:1},
  {success:true,paid:true,amount:"1500"},
  {success:true,paid:true,paid_amount:1500},
  null,{},[]
 ]) assert.equal(verifiedPaymentAmount(invalid,1500),false);
});
