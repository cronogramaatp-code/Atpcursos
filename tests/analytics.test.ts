import test from "node:test";
import assert from "node:assert/strict";
import {rate} from "../src/analytics";

test("conversion is based on paid checkouts, not page views",()=>{
 assert.equal(rate(0,0),0);
 assert.equal(rate(1,4),25);
 assert.equal(rate(2,3),66.67);
 assert.equal(rate(5,10),50);
});
test("analytics never generates invalid ratios",()=>{
 assert.equal(rate(-2,10),0);
 assert.equal(rate(20,10),100);
 assert.equal(rate(NaN,10),0);
 assert.equal(rate(10,Infinity),0);
});
