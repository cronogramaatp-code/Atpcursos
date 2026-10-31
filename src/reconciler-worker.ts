import { reconcile } from "./checkout";
import type { Env } from "./infra";

/**
 * Dedicated scheduled entrypoint. No public store or admin APIs are mounted here.
 * This Worker uses only resources owned by the atpconcursos application.
 */
export interface ReconcilerEnv extends Env {
 RECONCILIATION_ENABLED?: string;
}

function validStoreOrigin(env:ReconcilerEnv):boolean{
 try{
  if(!env.PUBLIC_BASE_URL)return false;
  const url=new URL(env.PUBLIC_BASE_URL);
  if(url.protocol!=="https:"||url.username||url.password||url.port||url.pathname!=="/"||url.search||url.hash)return false;
  if(env.ENVIRONMENT==="staging")
   return url.hostname==="atpcursos-staging.pages.dev"||url.hostname.endsWith(".atpcursos-staging.pages.dev");
  if(env.ENVIRONMENT==="production")
   return ["atpcursos.cronogramaatp.com.br","atpconcursos.cronogramaatp.com.br"].includes(url.hostname);
  return false;
 }catch{return false;}
}

export default {
 async fetch(_req:Request,_env:ReconcilerEnv,_ctx:ExecutionContext):Promise<Response>{
  return new Response("Not found",{status:404,headers:{"cache-control":"no-store","x-robots-tag":"noindex","x-content-type-options":"nosniff"}});
 },
 async scheduled(_event:ScheduledEvent,env:ReconcilerEnv,_ctx:ExecutionContext):Promise<void>{
  // Explicit opt-in gate. A new staging deployment remains inert by default.
  if(env.RECONCILIATION_ENABLED!=="true")return;
  if(!env.DB||!env.PDFS||!env.ASSETS||!env.INFINITEPAY_HANDLE||
     !env.BUYER_HASH_KEY||!env.RESEND_API_KEY||!env.RESEND_FROM_EMAIL||
     !validStoreOrigin(env))
   throw Error("RECONCILER_MISCONFIGURED");
  await reconcile(env);
 }
};
