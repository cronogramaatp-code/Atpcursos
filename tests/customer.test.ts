import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail,validEmail,validName,validPassword,validCourtesyExpiry,secretHash,newSecret,passwordHash,passwordMatch } from "../src/domain/customer";
test("customer emails are normalized, malformed values rejected",()=>{
 assert.equal(normalizeEmail("  Aluna@Email.COM  "),"aluna@email.com");
 assert.ok(validEmail("Aluna@Email.COM")); assert.equal(validEmail("a@@b"),false);
 assert.ok(validName("Mariana Souza")); assert.equal(validName("<script>"),false);
});
test("courtesy expiry: indefinitely or limited to one year",()=>{
 const t=1800000000; assert.equal(validCourtesyExpiry(null,t),true);
 assert.equal(validCourtesyExpiry(t,t),false); assert.equal(validCourtesyExpiry(t+86400,t),true);
 assert.equal(validCourtesyExpiry(t+367*86400,t),false);
});
test("access and reset tokens are random, hashes do not disclose token",async()=>{
 const a=newSecret(),b=newSecret();assert.equal(a.length,64);assert.notEqual(a,b);
 assert.equal((await secretHash(a)).length,64);assert.notEqual(await secretHash(a),a);
});
test("password hash with salt, 12 character minimum and verify failure",async()=>{
 assert.equal(validPassword("short"),false);
 const h=await passwordHash("Senha-forte-12345");
 assert.equal(h.iterations,310000);
 assert.ok(await passwordMatch("Senha-forte-12345",h.salt,h.digest,h.iterations));
 assert.equal(await passwordMatch("Senha-errada-12345",h.salt,h.digest,h.iterations),false);
});
