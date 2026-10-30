# atpconcursos — Aplicação inicial da identidade oficial

## Identidade definida
Nome comercial: **atpconcursos**, com letras minúsculas.
Paleta oficial permanente: `#153F59`, `#245F7A`, `#DFEBF2`, `#F17950`, `#FFFFFF`, `#F5F6F2`, `#1B252D`, `#717A80`, `#E2E6E8`, `#EDF1F3`.

## Mudanças efetivas em branch isolada
- Tokens centrais e overrides de CSS acrescentados ao fim de `src/design.ts`, prevalecendo sobre a folha legada para as superfícies principais (loja, vendas, aluno e ADM).
- Botão coral `#F17950` com texto grafite `#1B252D`; links `#245F7A` sobre branco; título e fundo azul `#153F59`.
- Cabeçalho usa o emblema ATP original presente no repositório e **texto simples atpconcursos**, em vez do antigo arquivo de wordmark. A geometria do emblema não foi alterada.
- Nome comercial atualizado nas mensagens e cópia pública dos módulos afetados, incluindo loja, e-mails de compra e alertas.
- Manifest do PWA alterado para o novo nome e as cores da paleta, com atualização da versão de cache do service worker. A URL do produto não foi alterada.

## Pendências importantes antes de aprovação final
1. Os PNG/JPG/SVG de marca **não foram recoloridos** nesta fase; ainda são variantes legadas. Exige derivação visual da logo original enviada pelo proprietário, mantendo triângulo e seta integrados, com aprovação de proporções e cores.
2. A folha CSS contém declarações legadas antigas anteriores ao bloco final. O novo bloco prevalece nas superfícies principais; auditoria visual de componentes e remoção controlada do legado são necessárias antes de afirmar conformidade cromática integral.
3. Validação visual local efetuada em 320, 390, 768 e 1440 px no navegador VAIO, sem overflow horizontal e com botão coral/texto grafite efetivos. Ainda faltam zoom 200%, foco por teclado, leitor de tela, teste de catálogo/checkout autenticado e homologação no domínio real.
4. O domínio antigo **atpcursos.cronogramaatp.com.br** continua em uso. Somente após configurar DNS/SSL e o novo host deverá ser alterado canonical/sitemap/URLs de e-mail; **não fazer alteração isolada do canonical sem migração de domínio**.
5. Não modificar a configuração de compra, segredos, dados do aluno ou integração com outros projetos.

## Evidência
Testes automatizados de identidade, cores, contraste, HTML e PWA estão na suíte do repositório. O lançamento depende dos Quality Gates financeiro, jurídico e de segurança.


## Evidência adicional de navegador
- Playwright MCP VAIO abriu HTML estático gerado a partir da função storefront() na porta local 8877. Captura visual desktop e mobile (390px) revisada.
- Em 320/390/768/1440px, scrollWidth <= innerWidth, sem overflow horizontal observado.
- Cores computadas no mobile: body rgb(245,246,242), CTA rgb(241,121,80) e texto CTA rgb(27,37,45).
- Os links de preview da Cloudflare Pages para o commit desta branch retornaram 404 Deployment Not Found; portanto, a QA pública de preview está bloqueada apesar do CI passar.
- O catálogo API retornou erro na revisão estática local, por não haver Worker/D1 em execução: esta evidência não comprova venda, carregamento real de produtos ou entrega de PDFs.
- O símbolo existente ainda mostra as cores legadas; a recoloração deve partir da logo fonte com edição de imagem e comparação geométrica independente.