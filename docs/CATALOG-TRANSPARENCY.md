# atpconcursos — Transparência do catálogo PDF

Estado: implementação concluída em branch isolada, sem merge nem deploy.

## Requisitos atendidos
- `GET /api/products`: retorna catálogo publicado com `file_count` contado em `product_files` e `page_count` calculado somente quando **todos** os arquivos têm contagem positiva.
- `GET /api/products/:slug`: além do produto, retorna a lista ordenada `files[]` contendo **apenas** título público e contagem de páginas confirmada por arquivo.
- Produtos em rascunho continuam inacessíveis pelas rotas públicas.
- `original_key`, nomes internos do bucket e caminhos R2 **não são enviados ao comprador**.
- O painel ADM também calcula a contagem real a partir dos arquivos relacionados, em vez de confiar no `products.page_count` legado.
- A loja exibe quantidade de PDFs e, quando a contagem de páginas estiver desconhecida, o aviso “contagem de páginas em revisão”. Nenhum “0 páginas” é anunciado como dado editorial verificado.
- Os botões, checkout e a configuração `CHECKOUT_ENABLED` não foram modificados.

## Regra de contagem
`page_count = SUM(product_files.page_count)` somente se existir pelo menos um arquivo e **nenhum** tiver contagem ausente ou zero. Caso contrário, `page_count = null`.
Amostra validada: combo de oito arquivos com um sem contagem = oito PDFs e páginas pendentes; combo com dois arquivos conhecidos (1+2 páginas) = dois PDFs e três páginas.

## Testes
- Rotas públicas e backend com SQLite em memória, incluindo títulos em ordem e rascunhos ocultos.
- Proteção da resposta JSON contra divulgação de `original_key` e R2.
- Listagem ADM, teste de parse de JS de cliente e identificação de visualização condicional.
- Build TypeScript e Pages, suíte completa, schema smoke e `npm audit`.

## Pendências não cobertas
- Revisão editorial/qualidade e licenças dos arquivos reais no R2.
- Reparação de páginas desconhecidas de PDFs importados; não preencher números por suposição.
- Gestão visual completa de múltiplos PDFs na interface administrativa.
- Configuração isolada de segredos/Resend/InfinitePay e homologação funcional do checkout.
- UI real da aplicação em staging (links públicos de preview estavam indisponíveis nas verificações anteriores).

Qualquer liberação comercial depende dos Quality Gates de segurança, conteúdo e transação real.
