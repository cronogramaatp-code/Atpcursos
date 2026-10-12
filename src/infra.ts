import { createRemoteJWKSet, jwtVerify } from "jose";
export interface Env {
 DB: D1Database; PDFS: R2Bucket; ASSETS: Fetcher; ENVIRONMENT?: string;
 INFINITEPAY_HANDLE?: string; RESEND_API_KEY?: string; RESEND_FROM_EMAIL?: string;
 PUBLIC_BASE_URL?: string; BUYER_HASH_KEY?: string; CHECKOUT_ENABLED?: string;
 ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string; ADMIN_ALLOWED_EMAILS?: string;
}
export const uuid=()=>crypto.randomUUID();
export const now=()=>Math.floor(Date.now()/1000);
export const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff"}});
export const plain=(s:string,status=200)=>new Response(s,{status,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}});
export const html=(s:string,req?:Request)=>{
 const url=req?new URL(req.url):null;
 const body=s.replaceAll("__ORIGIN__",url?.origin||"").replaceAll("__PAGE_URL__",url?url.origin+url.pathname:"");
 return new Response(body,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","referrer-policy":"no-referrer","x-content-type-options":"nosniff","x-frame-options":"DENY",...(url && url.hostname.startsWith("staging-") ? {"x-robots-tag":"noindex, nofollow"} : {})}});
};
export const moneyOK=(n:unknown):n is number=>Number.isSafeInteger(n)&&Number(n)>=100&&Number(n)<=20_000_000;
export const emailOK=(e:string)=>e.length>=5&&e.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export function originOK(req:Request){const origin=req.headers.get("origin");return !origin||origin===new URL(req.url).origin;}
export async function readJSON(req:Request,max=8192):Promise<Record<string,unknown>>{
 if(Number(req.headers.get("content-length")||0)>max)throw Error("too large");
 const s=await req.text();if(s.length>max)throw Error("too large");
 const v:unknown=JSON.parse(s);if(!v||typeof v!=="object"||Array.isArray(v))throw Error("bad json");
 return v as Record<string,unknown>;
}
export async function sha256(s:string){
 const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function emailHash(email:string,secret:string){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),"HMAC",false,["sign"]);
 const b=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(email.trim().toLowerCase()));
 return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function adminIdentity(req:Request,env:Env):Promise<string|null>{
 if(!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD||!env.ADMIN_ALLOWED_EMAILS)return null;
 const base=env.ACCESS_TEAM_DOMAIN.replace(/\/$/,"");
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(base))return null;
 const token=req.headers.get("Cf-Access-Jwt-Assertion");if(!token)return null;
 try{
  const jwks=createRemoteJWKSet(new URL(base+"/cdn-cgi/access/certs"));
  const {payload}=await jwtVerify(token,jwks,{issuer:base,audience:env.ACCESS_AUD,algorithms:["RS256"]});
  const email=typeof payload.email==="string"?payload.email.toLowerCase():"";
  const allow=env.ADMIN_ALLOWED_EMAILS.split(",").map(x=>x.trim().toLowerCase());
  return email&&allow.includes(email)?email:null;
 }catch{return null;}
}
