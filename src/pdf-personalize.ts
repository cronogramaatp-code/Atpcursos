import { PDFDocument, degrees, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * Stamp the exact buyer identity using an OFL-licensed Unicode font.
 * Never normalize, transliterate or strip buyer names.
 */
export async function personalize(source:ArrayBuffer,name:string,email:string,fontBytes:ArrayBuffer):Promise<Uint8Array> {
 const doc=await PDFDocument.load(source,{ignoreEncryption:false});
 doc.registerFontkit(fontkit);
 const font=await doc.embedFont(fontBytes,{subset:true});
 const buyer=name.trim();
 const recipient=email.trim();
 if(!buyer||!recipient)throw Error("EMPTY_WATERMARK_IDENTITY");
 const centered="EXCLUSIVO: "+buyer+" | "+recipient;
 const footer="ATPCursos | "+buyer+" | "+recipient;
 const pages=doc.getPages();
 if(!pages.length)throw Error("PDF_WITHOUT_PAGES");
 for(const page of pages){
  const {width,height}=page.getSize();
  const size=Math.max(6,Math.min(16,(width*0.69)/Math.max(1,font.widthOfTextAtSize(centered,1))));
  page.drawText(centered,{
   x:width*0.09,y:height*0.51,size,font,rotate:degrees(25),
   color:rgb(.24,.36,.58),opacity:.16
  });
  const fs=Math.max(5,Math.min(8,(width-32)/Math.max(1,font.widthOfTextAtSize(footer,1))));
  page.drawText(footer,{
   x:16,y:Math.min(17,height*.027),size:fs,font,
   color:rgb(.22,.32,.47),opacity:.58
  });
 }
 return doc.save();
}
