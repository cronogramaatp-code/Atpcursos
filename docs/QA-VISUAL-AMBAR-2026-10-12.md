# ATPCursos | Auditoria visual Âmbar & Areia — 12/10/2026

## Objetivo
Padronizar a mesma identidade visual em loja, quatro páginas rotativas de vendas, biblioteca do aluno e três telas do ADM, preservando as verificações de segurança e de pagamento.

## Sistema visual validado
- Preto carvão: `#171512`.
- Laranja âmbar: `#EE701E` (CTA com texto carvão).
- Areia dourada: `#F2C98D`.
- Fundo areia: `#F8F3EA`.
- Grafite quente: `#28221C`.
- Marfim: `#FFFDF9`.

## Logo e ativos
O símbolo aprovado do ATPCursos foi preservado geometricamente e recolorido em cobre, laranja e areia. Fonte original rastreável em `assets/brand/logo-atp-original.png`, fora do diretório público. Arquivos públicos regenerados pelo script `tools/build-amber-brand.py`: `logo-atp.png`, todos os tamanhos de favicon, ícones PWA normal/maskable, Apple Touch Icon e `og-atpcursos.jpg`. O Service Worker mudou para `atpcursos-public-amber-v2` para invalidar o cache de ativos antigos.

## Testes automatizados
- 37/37 testes unitários/integrados: PASS.
- TypeScript `npm run build`: PASS.
- Bundle Pages `npm run build:pages`: PASS.
- Contraste do texto carvão em botão âmbar >= 4,5:1: PASS.
- 12 capturas reais do navegador (390px e 1440px): PASS.
- Estouro horizontal: 0 pixels nos 12 cenários.
- Recursos de logo carregados: PASS em todos os cenários.
- Cor da ação primária: `rgb(238, 112, 30)` nas páginas públicas e área do aluno.
- Erros JavaScript na navegação/captura: nenhum.
- Páginas: `/loja`, `/oferta-01`, `/oferta-02`, `/oferta-03`, `/oferta-04`, `/meus-materiais`.
- ADM: dashboards `adminPage()` desktop/mobile e `adminImport()` mobile em renderização estática, sem credenciais.

Capturas e relatório JSON armazenados no VAIO em `D:\AI\ATPCursosQA\branding-amber\`.

## Segurança, comercial e limites da verificação
- ADM de produção/homologação continua sujeito ao Cloudflare Access; rotas sem login são redirecionadas.
- A conferência visual do ADM foi **estática**, não um login real nem um teste de operação administrativa autorizada.
- A nova identidade está publicada apenas em `atpcursos-staging`; produção não deve ser promovida sem gate.
- Não foram cadastrados produtos fictícios para preencher vitrine. O catálogo ainda estava vazio na auditoria.
- `CHECKOUT_ENABLED=false`: checkout deve permanecer desligado até a homologação comercial e financeira.
- Não há promessa de aprovação, escassez ou avaliações de clientes inventadas.
- Gate do redesign: PASS em layout/código/QA visual. Gate do lançamento comercial: PARTIAL/BLOCKED por catálogo, credenciais de pagamento e entrega transacional.
