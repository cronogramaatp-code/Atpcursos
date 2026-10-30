# atpconcursos — DESIGN (sistema visual permanente)
Versão 2.0 | 29/10/2026 | Design proposto para integração incremental, NÃO implantado.

## 1. Identidade
Marca textual exata: **atpconcursos**, em caixa baixa nos elementos comerciais, sem espaços artificiais. A fonte visual é a logo ATP original fornecida pelo proprietário em 29/10/2026: marca triangular estilizada com seta central integrada e moldura circular na imagem de referência. Preservar proporções e geometria; converter materiais e ícones apenas a partir da original autenticada. Aplicar paleta em variante clara e escura sem alterar o contorno, substituindo vermelho/dourado anterior de maneira controlada.
Não afirmar que assets foram recriados ou aprovados; nenhum PNG/SVG novo foi gerado nesta etapa.

## 2. Tokens — paleta oficial permanente
| Papel | Cor HEX | Uso |
|---|---|---|
| Azul principal | #153F59 | header, nav, títulos em fundo claro, marca |
| Azul complementar | #245F7A | links, estados, detalhes |
| Azul claro | #DFEBF2 | superfícies e painéis |
| Coral | #F17950 | ação comercial e detalhes expressivos |
| Branco | #FFFFFF | superfícies principais |
| Off-white | #F5F6F2 | fundo de página |
| Grafite | #1B252D | texto principal, contraste no botão coral |
| Cinza | #717A80 | separadores, ícones, textos apenas quando contraste suficiente |
| Cinza claro | #E2E6E8 | bordas |
| Cinza gelo | #EDF1F3 | backgrounds secundários |

Aplicação CSS planejada:
~~~css
:root {
  --brand-primary: #153F59;
  --brand-secondary: #245F7A;
  --brand-light: #DFEBF2;
  --accent: #F17950;
  --white: #FFFFFF;
  --page: #F5F6F2;
  --ink: #1B252D;
  --muted: #717A80;
  --border: #E2E6E8;
  --surface: #EDF1F3;
}
~~~

## 3. Combinações acessíveis
- Azul #153F59 em branco: contraste aproximado 11,13:1. Azul #245F7A em branco: ~7,02:1.
- Coral #F17950 + branco: ~2,77:1, não usar para botões com texto branco comum.
- Coral #F17950 + grafite #1B252D: ~5,63:1, combinação preferida para CTA.
- Grafite #1B252D em branco: ~15,57:1. Cinza #717A80 sobre branco: ~4,38:1, não usar em texto pequeno.
- Testar contraste real após aplicar transparência, opacidade, hover, foco e estados disabled.

## 4. Estética e layout
Clean, profissional, comercial, leve, responsivo; evitar excesso de cards aninhados, gradientes chamativos, brilhos, selos militares, escudos e elementos inventados. Hero organizado, título conciso, principal CTA “Ver materiais” ou “Comprar material” conforme estado real; elementos de confiança baseados em fatos.
Componentes: barra de navegação clara/azul, cards individuais de material com capa real, preço e quantidade de arquivos, busca/filtros, página de produto com lista dos PDFs incluídos, condições de entrega, FAQ, área do aluno e admin com tabelas navegáveis.
Usar um design system no CSS existente src/design.ts; não criar dependência de framework para tokens simples. Preservar componentes atuais onde funcionam.

## 5. Telas essenciais
**Home/Loja**: logo, pesquisa, filtros, categorias, produtos publicados e estado vazio honesto quando catálogo não disponível.
**Produto/combo**: capa, título, concurso, descrição, conteúdos incluídos, N PDFs, total de páginas verificado ou “contagem em revisão”, preço, benefícios e limites de download; checkout sem elementos falsos.
**Venda**: quatro páginas já existentes, revisão de clareza, CTA, prova social real e rastreamento do funil.
**Aluno**: e-mail, PIN de oito dígitos, mostrar/ocultar, recuperação, biblioteca integrada de compras e cortesias, estados pendente/entregue/falha, reenvio autorizado.
**ADM**: Cloudflare Access na borda + PIN, resumo comercial, tabelas e filtros, editor de produtos/arquivos, clientes/cortesias, pedidos e logs de entrega.
**Legais**: privacidade, termos, suporte e reembolso com informações revisadas.

## 6. Layout e acessibilidade
- Priorizar mobile 320/375/390px; tablet 768px; desktop 1280/1440px; zoom 200%.
- Labels visíveis, mensagens de erro orientativas, sem revelar dados de outros compradores, foco visível, teclado, leitura por screen reader e prefers-reduced-motion.
- Inputs de PIN: type=password, inputmode=numeric, maxlength=8, autocomplete=current-password para login, new-password para troca; validação equivalente no servidor. Não transformar senha numérica em number.
- Estado de botão: padrão/hover/foco/loading/desabilitado/sucesso/erro.
- Para produto sem página contada: não exibir “0 páginas” como se fosse valor confirmado.
- Links críticos: carrinho/checkout, login, redefinição, política, suporte, download.

## 7. Assets e SEO
Partir de assets/brand/source-logo.jpeg ou imagem original enviada; manter cópia original imutável e versões derivadas com rastreabilidade. Derivar favicon 16/32, Apple Touch 180, PWA 192/512, logo de cabeçalho, capa social OG 1200x630; validar preview em celular e desktop. Atualizar manifest, src/seo.ts, title/meta/OG/canonical e sitemap após configurar domínio novo. Rotas admin e sessão nunca indexáveis.

## 8. Processo de aprovação
Impeccable (audit/critique) -> correções mínimas -> comparação visuais antes/depois -> teste a11y + desempenho -> aprovação da marca -> merge. Não usar gerador de imagens como substituto da logo original.
