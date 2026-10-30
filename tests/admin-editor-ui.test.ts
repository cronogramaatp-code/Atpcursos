import test from "node:test";
import assert from "node:assert/strict";
import { clientJS } from "../src/client";
import { adminImport } from "../src/ui";

test("admin draft editor can list, add and remove PDF files using existing protected routes",()=>{
 assert.match(clientJS,/\/api\/admin\/products\//);
 assert.match(clientJS,/\/files/);
 assert.match(clientJS,/method:"DELETE"/);
 assert.match(clientJS,/maxProductFiles/);
 assert.match(clientJS,/maxFileBytes/);
 assert.match(clientJS,/name=.+encodeURIComponent/);
 assert.match(clientJS,/f\.page_count===1/);
 assert.match(clientJS,/p\.file_count===1/);
 assert.doesNotThrow(()=>new Function(clientJS));
});

test("admin form discloses actual 50MB per-file upload limit",()=>{
 assert.match(adminImport(),/50 MB/);
 assert.doesNotMatch(adminImport(),/15 MB/);
});
