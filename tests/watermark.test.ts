import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PDFDocument, StandardFonts, rgb} from "pdf-lib";
import {personalize} from "../src/fulfillment";
const font=()=>Uint8Array.from(readFileSync("public/fonts/NotoSans-Regular.ttf")).buffer;

async function samplePDF(pages:number){
 const doc=await PDFDocument.create();
 const f=await doc.embedFont(StandardFonts.Helvetica);
 for(let i=0;i<pages;i++){
  const p=doc.addPage([595,842]);
  p.drawText("Material de estudo ATP - pagina "+(i+1),{
    font:f,size:20,x:32,y:790,color:rgb(0,0,0)
  });
 }
 return Uint8Array.from(await doc.save()).buffer;
}
test("watermark supports Portuguese accents and preserves every source page",async()=>{
 const src=await samplePDF(3);
 const pdf=await personalize(src,"João da Conceição","joao@email.com",font());
 const loaded=await PDFDocument.load(pdf);
 assert.equal(loaded.getPageCount(),3);
 assert.ok(pdf.byteLength>src.byteLength);
 for(const page of loaded.getPages()){
  assert.ok(page.node.Contents());
 }
});
test("watermark rejects empty customer identity",async()=>{
 const src=await samplePDF(1);
 await assert.rejects(()=>personalize(src,"","e@e.com",font()),/EMPTY_WATERMARK_IDENTITY/);
 await assert.rejects(()=>personalize(src,"João","",font()),/EMPTY_WATERMARK_IDENTITY/);
});
