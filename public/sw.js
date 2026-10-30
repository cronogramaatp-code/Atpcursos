/* ATPCursos PWA: cache ONLY the public shell and brand assets. Never cache orders, admin, customer accounts, PDFs, API, checkout, or download tokens. */
const VERSION="atpcursos-public-brand-v4";
const SHELL=["/loja","/app.js","/manifest.webmanifest","/brand/logo-atp.png","/brand/icon-192.png","/brand/icon-512.png"];
const isPublicAsset=p=>p==="/app.js"||p==="/manifest.webmanifest"||p.startsWith("/brand/");
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(VERSION).then(async cache=>{
  for(const path of SHELL){
   try{const response=await fetch(path,{credentials:"omit"});if(response.ok)await cache.put(path,response)}catch{}
  }
 }).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(async keys=>{
  await Promise.all(keys.filter(key=>key.startsWith("atpcursos-public-")&&key!==VERSION).map(key=>caches.delete(key)));
  await self.clients.claim();
 }));
});
self.addEventListener("fetch",event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=="GET"||url.origin!==self.location.origin)return;
 const p=url.pathname;
 if(p==="/loja"||p==="/"){
  event.respondWith(fetch(req).then(r=>r).catch(async()=>{
   const cache=await caches.open(VERSION);
   return (await cache.match("/loja"))||new Response("Conecte-se para visualizar os materiais.",{status:503,headers:{"content-type":"text/plain; charset=utf-8"}});
  }));
  return;
 }
 if(!isPublicAsset(p))return;
 event.respondWith(caches.open(VERSION).then(async cache=>{
  const found=await cache.match(p);
  const fetchFresh=fetch(req,{credentials:"omit"}).then(async response=>{
   if(response.ok&&response.type!=="opaque")await cache.put(p,response.clone());
   return response;
  });
  try{return await fetchFresh}catch{return found||new Response('Offline',{status:503})}
 }));
});