import { premiumStyles } from "./design";

const catalog = `<div class="section-heading" id="catalogo"><div><span class="eyebrow">Biblioteca de PDFs</span><h2>Encontre o material certo para estudar</h2><p>Explore os PDFs disponíveis, filtre pela categoria e confira cada material antes da compra.</p></div></div>
<div class="toolbar"><input id="q" type="search" placeholder="Busque por concurso, assunto ou disciplina" aria-label="Pesquisar materiais"><select id="tipo" aria-label="Filtrar por categoria"><option value="">Todas as categorias</option><option>Simulados</option><option>Mapas mentais</option><option>Resumões</option><option>Apostilas</option><option>Cronogramas</option><option>Combos</option></select></div>
<div class="grid" id="results" aria-live="polite">Carregando catálogo...</div>`;

const features = `<div class="feature-grid" aria-label="Como o atpconcursos ajuda">
<div class="feature"><span class="feature-icon" aria-hidden="true">01</span><h3>Foco no conteúdo</h3><p>Materiais digitais organizados por assunto, disciplina e concurso.</p></div>
<div class="feature"><span class="feature-icon" aria-hidden="true">02</span><h3>PDF personalizado</h3><p>O material adquirido recebe identificação individual de nome e e-mail.</p></div>
<div class="feature"><span class="feature-icon" aria-hidden="true">03</span><h3>Entrega digital</h3><p>Após a confirmação do pagamento, o acesso é enviado por e-mail.</p></div>
<div class="feature"><span class="feature-icon" aria-hidden="true">04</span><h3>Acesso organizado</h3><p>Seus materiais e cortesias em uma área simples de consultar.</p></div></div>`;

const howItWorks = `<section class="section-heading" id="como-funciona"><div><span class="eyebrow">Simples e transparente</span><h2>Seu material em três etapas</h2><p>Escolha o PDF, informe os dados para personalização e receba as instruções de acesso.</p></div></section>
<div class="step-grid"><div class="step"><span class="step-number">1</span><h3>Escolha</h3><p>Veja detalhes, disciplina e valor do material.</p></div>
<div class="step"><span class="step-number">2</span><h3>Informe seus dados</h3><p>Nome completo e e-mail para identificação do PDF.</p></div>
<div class="step"><span class="step-number">3</span><h3>Receba</h3><p>O envio acontece após o pagamento ser confirmado.</p></div>
<div class="step"><span class="step-number">✓</span><h3>Estude do seu jeito</h3><p>Baixe seu material digital e organize sua rotina.</p></div></div>`;

export const storefront = () => layout(`
<section class="market-hero" aria-labelledby="home-title">
 <div><span class="eyebrow">atpconcursos · Biblioteca digital</span><h1 id="home-title">PDFs para estudar cada etapa do seu concurso.</h1><p>Compare simulados, mapas mentais, cronogramas e apostilas. Confira conteúdo e preço antes de escolher seu PDF.</p>
 <div class="hero-actions"><a class="btn gold" href="#catalogo">Explorar materiais <span aria-hidden="true">↗</span></a><a class="btn ghost" href="/ofertas">Conhecer as ofertas</a></div>
 <div class="trust-row"><span>PDFs personalizados</span><span>Entrega por e-mail</span><span>Catálogo transparente</span></div></div>
 <div class="hero-visual hero-thay"><img class="thay-avatar portrait" src="/brand/thay-avatar-portrait.webp?v=sem-letras-2" width="840" height="1078" alt="Avatar ilustrada da Thay com uniforme preto da área de segurança" decoding="async" fetchpriority="high"><div class="hero-mini">Materiais para sua preparação</div></div>
</section>
<div class="section-heading"><div><span class="eyebrow">Sua próxima revisão</span><h2>Escolha por disciplina, concurso ou formato</h2><p>Filtre por categoria e veja as informações de cada material disponível.</p></div></div>
${features}
<div class="section-heading"><div><span class="eyebrow">Escolha como estudar</span><h2>Formatos para diferentes objetivos</h2></div></div>
<div class="category-grid"><a href="#catalogo" class="category-tile"><strong>Mapas mentais</strong><span aria-hidden="true">↗</span></a><a href="#catalogo" class="category-tile"><strong>Simulados</strong><span aria-hidden="true">↗</span></a><a href="#catalogo" class="category-tile"><strong>Cronogramas</strong><span aria-hidden="true">↗</span></a><a href="#catalogo" class="category-tile"><strong>Apostilas e resumos</strong><span aria-hidden="true">↗</span></a></div>
${catalog}${howItWorks}
<div class="bottom-cta"><div><h2>Encontre seu próximo material.</h2><p>Pesquise no catálogo e escolha o conteúdo adequado para sua preparação.</p></div><a class="btn gold" href="#catalogo">Ver PDFs disponíveis</a></div>
`, "Loja de PDFs");

export interface ProductSeo { title: string; description: string | null; category: string | null; contest: string | null; discipline: string | null; slug: string; }
const escapeAttr = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
export const productPage = (product: ProductSeo) => layout(`
<p class="muted"><a href="/loja">← Voltar ao catálogo</a> / Material digital</p>
<div class="product-layout"><section class="card"><div class="thumb" aria-hidden="true">PDF ATP</div><span class="eyebrow">Conteúdo digital</span><div id="prod" aria-live="polite"></div><div class="sale-points"><div class="sale-point">Arquivo PDF para download</div><div class="sale-point">Identificação individual no material</div><div class="sale-point">Entrega após pagamento confirmado</div></div></section>
<aside class="card"><span class="eyebrow">Seu pedido</span><h2>Comprar material</h2><p class="muted">Confira seu material e preencha os dados de personalização.</p>
<form id="buy"><label>Nome completo<input name="name" required maxlength="120" autocomplete="name"></label><label>E-mail de entrega<input name="email" type="email" required maxlength="254" autocomplete="email"></label><h3>Complemente seus estudos</h3><div id="offers" class="offers"></div><p id="quote" class="price" aria-live="polite"></p><p class="muted">Seu nome e e-mail serão utilizados para identificar as páginas do PDF.</p><button class="btn" type="submit">Continuar com InfinitePay →</button><p id="msg" role="status"></p></form></aside></div>
`, product.title + " — PDF para concursos", false, product);

export const myMaterials = () => layout('<div class="student-panel"><div class="student-intro"><h1>Meus materiais</h1><p>Um espaço para organizar seus PDFs adquiridos.</p></div><div class="card"><p>O acesso aos PDFs comprados é enviado ao e-mail informado após confirmação do pagamento.</p><a class="btn" href="/loja">Voltar à loja</a></div></div>', "Meus Materiais");

const side = `<aside class="side" aria-label="Menu administrativo"><div class="side-brand"><img src="/brand/logo-atp.png" width="42" height="42" alt="Emblema atpconcursos"><span>atpconcursos<br>Central administrativa</span></div><a href="/adm">Visão geral</a><a href="/adm/produtos">Produtos e PDFs</a><a href="/adm/alunos">Alunos e cortesias</a><a href="/loja">Abrir loja ↗</a></aside>`;

export const adminPage = () => layout(`<div class="admin">${side}<section><div class="admin-intro"><div><span class="eyebrow">Central de gestão</span><h1>Visão geral</h1><p class="muted">Acompanhe vendas verificadas, pedidos, descontos e presença. Os dados são atualizados a cada 60 segundos.</p></div><img src="/brand/thay-avatar-full.webp?v=sem-letras-2" alt="Avatar da Thay, personagem visual do atpconcursos" width="100" height="183" loading="lazy"></div>
<div id="kpis" class="kpis" aria-live="polite"><article class="card"><span>Indicadores de vendas</span><strong>Carregando...</strong></article></div><div class="section-heading"><div><h2>Últimos pedidos</h2><p>Informações obtidas do banco oficial deste ambiente.</p></div></div><div class="card" style="overflow:auto"><table class="table"><thead><tr><th>Data</th><th>Pedido</th><th>Status</th><th>Valor</th></tr></thead><tbody id="orders"><tr><td colspan="4" class="muted">Aguardando os pedidos deste ambiente.</td></tr></tbody></table></div></section></div>`, "Admin", true);

export const adminImport = () => layout(`<div class="admin">${side}<section><span class="eyebrow">Biblioteca digital</span><h1>Produtos e PDFs</h1><p class="muted">Cadastre cada material em rascunho. O arquivo original fica em armazenamento privado até a publicação controlada.</p>
<div class="card"><h2>Novo material</h2><form id="create"><div class="formgrid"><label>Título<input name="title" required maxlength="140"></label><label>Categoria<select name="category"><option>Simulados</option><option>Mapas mentais</option><option>Resumões</option><option>Apostilas</option><option>Cronogramas</option><option>Combos</option></select></label><label>Concurso<input name="contest" maxlength="100"></label><label>Disciplina<input name="discipline" maxlength="100"></label><label>Preço em reais<input name="price" type="number" min="1" step=".01" required></label></div><label>Descrição<textarea name="description" rows="4"></textarea></label><label>Arquivo PDF privado (até 15 MB)<input name="pdf" type="file" required accept=".pdf,application/pdf"></label><button class="btn" type="submit">Salvar rascunho e importar PDF</button><p id="info" role="status"></p></form></div>
<div class="section-heading"><div><h2>Materiais cadastrados</h2><p>Revise os materiais antes de publicá-los na loja.</p></div></div><div id="list" class="card" aria-live="polite">Carregando produtos...</div>
</section></div>`, "Produtos e PDFs", true);

export function layout(body: string, title: string, admin = false, product?: ProductSeo) {
 const links = admin
  ? '<a href="/adm">Dashboard</a><a href="/adm/produtos">Produtos</a><a href="/adm/alunos">Alunos</a>'
  : '<a href="/loja">Biblioteca</a><a href="/ofertas">Ofertas</a><a href="/meus-materiais">Área do aluno</a>';
 const install = admin ? "" : '<button id="install-app" class="install-app" type="button" hidden>Instalar app</button>';
 const pageTitle = title + " | atpconcursos";
 const description = product ? [product.description?.trim(), product.contest && "Concurso: " + product.contest, product.discipline && "Disciplina: " + product.discipline, "Material digital em PDF para estudar para concursos."].filter(Boolean).join(" ").slice(0, 300) : "Materiais de estudo em PDF para concursos. PDFs personalizados, entregues por e-mail após confirmação do pagamento.";
 const canonical = product ? "https://atpcursos.cronogramaatp.com.br/produto/" + encodeURIComponent(product.slug) : null;
 const student = title.toLowerCase().includes("materiais") || title.toLowerCase().includes("confirma");
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#153F59"><meta name="application-name" content="atpconcursos"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="atpconcursos"><meta name="description" content="'+escapeAttr(description)+'"><title>'+escapeAttr(pageTitle)+'</title><link rel="icon" href="/brand/favicon.ico" sizes="any"><link rel="icon" href="/brand/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" sizes="180x180"><link rel="manifest" href="/manifest.webmanifest"><meta property="og:locale" content="pt_BR"><meta property="og:type" content="website"><meta property="og:site_name" content="atpconcursos"><meta property="og:title" content="'+escapeAttr(pageTitle)+'"><meta property="og:description" content="'+escapeAttr(description)+'"><meta property="og:image" content="__ORIGIN__/brand/og-atpcursos.jpg"><meta property="og:image:alt" content="Emblema atpconcursos"><meta property="og:url" content="'+(canonical || "__PAGE_URL__")+'"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="'+(canonical || "__PAGE_URL__")+'">'+(admin?'<meta name="robots" content="noindex,nofollow">':'')+'<style>'+premiumStyles+'</style></head><body class="'+(admin?'admin-view':student?'student-view':'store-view')+'"><header><nav><a class="brand" href="/loja" aria-label="atpconcursos — loja de PDFs"><img class="brand-emblem" src="/brand/logo-atp.png" alt="" width="48" height="48" decoding="async"><span class="brand-text">atpconcursos</span></a><div class="nav-links">'+links+install+'</div></nav></header><main>'+body+'</main><footer>© atpconcursos · Materiais digitais personalizados · <a href="/loja">Catálogo</a> · <a href="/meus-materiais">Meus materiais</a></footer><script src="/app.js" defer></script></body></html>';
}