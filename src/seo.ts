import type { Env } from "./infra";

const PROD_ORIGIN = "https://atpcursos.cronogramaatp.com.br";
const xmlEscape = (s: string) => s.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c] || c);

export function seoRobots(env: Env): Response {
 const staging = env.ENVIRONMENT !== "production";
 const body = staging ? "User-agent: *\nDisallow: /\n" :
  "User-agent: *\nAllow: /\nDisallow: /adm\nDisallow: /api/\nDisallow: /meus-materiais\nDisallow: /confirmar\nSitemap: " + PROD_ORIGIN + "/sitemap.xml\n";
 return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300", ...(staging ? { "x-robots-tag": "noindex, nofollow" } : {}) } });
}

export async function seoSitemap(env: Env): Promise<Response> {
 if (env.ENVIRONMENT !== "production") return new Response("Not Found", { status: 404, headers: { "x-robots-tag": "noindex, nofollow" } });
 if (!env.DB) return new Response("Unavailable", { status: 503 });
 const rows = await env.DB.prepare("SELECT slug FROM products WHERE status='published' ORDER BY slug LIMIT 5000").all<{ slug: string }>();
 const paths = ["/", "/loja", ...rows.results.filter(r => r.slug && /^[a-z0-9-]+$/.test(r.slug)).map(r => "/produto/" + encodeURIComponent(r.slug))];
 const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  paths.map(p => "  <url><loc>" + xmlEscape(PROD_ORIGIN + p) + "</loc></url>").join("\n") + "\n</urlset>";
 return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" } });
}
