import { layout } from "./ui";

type Offer={label:string;headline:string;subtitle:string;note:string;title:string;intro:string;bullets:[string,string,string];cta:string};
const offers:readonly Offer[]=[
 {label:"Sua biblioteca, com foco",headline:"PDFs para concursos, do planejamento à revisão.",subtitle:"Mapas mentais, simulados e cronogramas em uma biblioteca digital. Veja preço, descrição e disciplina antes de escolher.",note:"Biblioteca de PDFs para concursos",title:"Escolha o material de que você precisa",intro:"Da revisão à organização semanal, encontre recursos que combinam com sua rotina de estudos.",bullets:["PDFs para disciplinas e concursos","Identificação personalizada nos arquivos","Compra e entrega digital verificadas"],cta:"Ver biblioteca de PDFs"},
 {label:"Organização na prática",headline:"Organize sua rotina com PDFs de estudo.",subtitle:"Encontre arquivos digitais para planejar a semana, revisar os tópicos e praticar com simulados.",note:"Estrutura para estudar melhor",title:"Construa um estudo mais organizado",intro:"Cada formato atende a uma etapa: planejar, compreender, revisar e praticar.",bullets:["Cronogramas para organizar matérias","Mapas mentais para revisões visuais","Simulados para praticar o conteúdo"],cta:"Explorar formatos"},
 {label:"Clareza em cada etapa",headline:"Veja o material e o preço antes de comprar.",subtitle:"Confira o conteúdo e o preço de cada material. Sua cópia digital será identificada com nome e e-mail e disponibilizada após a confirmação do pagamento.",note:"Transparência e acesso digital",title:"Uma compra digital sem complicações",intro:"Conheça o funcionamento da loja e encontre seus materiais com informações claras.",bullets:["Preço apresentado antes do checkout","Arquivos originais mantidos em ambiente privado","Entrega após confirmação do pagamento"],cta:"Conhecer os materiais"},
 {label:"Segurança pública",headline:"PDFs para GCM e concursos de segurança pública.",subtitle:"Pesquise PDFs para concursos da área policial e guardas municipais. Os resultados refletem os produtos publicados na loja.",note:"Foco no seu próximo concurso",title:"Busque por concurso e disciplina",intro:"Use a busca para encontrar recursos específicos disponíveis na loja, sem promessas de aprovação.",bullets:["Busque conteúdos por concurso","Filtre por categoria de PDF","Escolha a revisão que faz sentido para você"],cta:"Pesquisar materiais"}
];

const catalog=`<div class="section-heading" id="catalogo"><div><span class="eyebrow">Explore materiais reais</span><h2>Catálogo de PDFs disponíveis</h2><p>Os produtos mostrados abaixo vêm diretamente do catálogo publicado, com os preços cadastrados.</p></div></div>
<div class="toolbar"><input id="q" type="search" aria-label="Pesquisar materiais" placeholder="Buscar por concurso ou disciplina"><select id="tipo" aria-label="Filtrar categoria"><option value="">Todas as categorias</option><option>Simulados</option><option>Mapas mentais</option><option>Resumões</option><option>Apostilas</option><option>Cronogramas</option><option>Combos</option></select></div>
<div id="results" class="grid" aria-live="polite">Carregando catálogo...</div>`;

const faq=`<section class="section-heading"><div><span class="eyebrow">Informações úteis</span><h2>Como funciona</h2></div></section><section class="faq" aria-label="Perguntas frequentes">
<details><summary>O que recebo na compra?</summary><p>Um material digital em PDF, identificado com nome e e-mail do comprador e entregue conforme a confirmação do pagamento.</p></details>
<details><summary>Como recebo meu arquivo?</summary><p>Depois da confirmação do pagamento, as informações de acesso são enviadas para o e-mail informado.</p></details>
<details><summary>Onde encontro meus materiais?</summary><p>Use o acesso enviado por e-mail. Para materiais de cortesia, consulte também a área do aluno.</p></details>
<details><summary>Como escolher o material?</summary><p>Use a busca e o filtro do catálogo, depois abra a página do produto para verificar título, descrição e preço.</p></details></section>`;

export function salesPage(variant: number):string{
 const index=Math.floor(variant)-1;if(index<0||index>=offers.length)throw Error("Variação inválida");
 const offer=offers[index];const tag=String(variant).padStart(2,"0");
 return layout(`<section class="sales-hero variant-${tag}" aria-labelledby="offer-title">
 <div><span class="eyebrow">${offer.label}</span><h1 id="offer-title">${offer.headline}</h1><p>${offer.subtitle}</p>
 <div class="hero-actions"><a class="btn gold" href="#catalogo">${offer.cta} →</a><a class="btn ghost" href="#como-funciona">Como funciona</a></div>
 <div class="trust-row"><span>PDF personalizado</span><span>Entrega digital</span><span>Preço claro</span></div></div>
 <div class="hero-visual hero-thay"><img class="thay-avatar ${variant===1||variant===3?"portrait":"full"}" src="/brand/thay-avatar-${variant===1||variant===3?"portrait":"full"}.webp?v=sem-letras-2" width="${variant===1||variant===3?840:582}" height="${variant===1||variant===3?1078:1066}" alt="Avatar ilustrada da Thay em uniforme da área de segurança" decoding="async" fetchpriority="high"><div class="hero-mini">${offer.note}</div></div>
 </section>
 <section class="section-heading"><div><span class="eyebrow">atpconcursos · Materiais digitais</span><h2>${offer.title}</h2><p>${offer.intro}</p></div></section>
 <div class="feature-grid" aria-label="Vantagens"><div class="feature"><span class="feature-icon">01</span><h3>${offer.bullets[0]}</h3><p>Escolha de acordo com seus objetivos e as opções disponíveis.</p></div>
 <div class="feature"><span class="feature-icon">02</span><h3>${offer.bullets[1]}</h3><p>Estude com o formato digital adequado para sua rotina.</p></div>
 <div class="feature"><span class="feature-icon">03</span><h3>${offer.bullets[2]}</h3><p>Informações claras sobre o material e o processo.</p></div>
 <div class="feature"><span class="feature-icon">✓</span><h3>Seleção sem pressão</h3><p>Compare materiais com tranquilidade antes de decidir.</p></div></div>
 ${catalog}
 <div id="como-funciona">${faq}</div>
 <div class="bottom-cta"><div><h2>Encontre seu próximo PDF.</h2><p>Confira os materiais disponíveis no catálogo do atpconcursos.</p></div><a class="btn gold" href="#catalogo">Ver materiais</a></div>
 `, `Materiais para concursos · ${offer.label}`);
}

export const OFFER_COOKIE="atp_oferta";
export function offerVariant(cookieHeader:string,randomValue:number):number{
 const m=/(?:^|;\s*)atp_oferta=(0[1-4])(?:;|$)/.exec(cookieHeader);
 return m?Number(m[1]):(Math.floor(randomValue)%4)+1;
}
export function rotateOffer(req:Request):Response{
 const current =new Uint32Array(1);crypto.getRandomValues(current);
 const n=offerVariant(req.headers.get("cookie")||"",current[0]);
 const chosen=String(n).padStart(2,"0");
 return new Response(null,{status:302,headers:{
 "location":"/oferta-"+chosen,
 "set-cookie":OFFER_COOKIE+"="+chosen+"; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax",
 "cache-control":"private, no-store","vary":"Cookie"
 }});
}