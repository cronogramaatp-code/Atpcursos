# ATPCursos — Multi-PDF e upload maior (12/10/2026)

## Escopo técnico
- Branch: `feat/spec-kit-loja-pdfs`. Não alterar outros repositórios ATP.
- Até 50 MiB por PDF, 20 PDFs por produto e 300 MiB por produto.
- Interface admin: seleção múltipla de PDFs, inclusão e exclusão no rascunho; lista de nomes de arquivos. Não permite alterar PDF de produto publicado.
- R2 privado: upload por stream; conferência de tamanho, cabeçalho e marcador final de PDF, análise estrutural via pdf-lib nos PDFs até 12 MiB. PDF grande (>12 MiB) precisa de revisão humana adicional antes da publicação, pois a checagem do envelope não equivale à validação integral.
- Migração aditiva `0005_multi_pdf_bundles.sql`: `product_files`, `order_item_files`, `bundle_deliveries`, `bundle_download_tokens`, `bundle_notifications`; retrocompatibilidade com originais legados.
- Checkout: snapshots imutáveis de cada arquivo da compra, evitando que alterações futuras modifiquem os materiais de um pedido.
- Pós-pagamento verificado: marca d'água em cada arquivo; entrega de links individuais em e-mail único por pedido; tokens de 72 horas / cinco downloads, sem PDF original público.
- Processamento tenta concluir os PDFs do pedido na mesma execução. **Bloqueio de escala:** em Cloudflare Pages a exportação de handler `scheduled` não prova execução de cron; homologar lotes grandes e provisionar reprocessamento confiável com Queue/Worker cron antes de ativar venda comercial de combos grandes. PDFs extensos podem ultrapassar o tempo/memória de execução.
- Catálogo é compatível com banco sem a migração; upload/publicação ficam bloqueados nesse caso.

## Dependências e bloqueios de implantação
1. Executar backup lógico do D1 de homologação **exclusivo** `atpcursos-staging-db` antes da migração.
2. Aplicar e verificar `migrations/0005_multi_pdf_bundles.sql` em **staging**; nunca aplicar a D1 de projetos ATP diferentes. Conferir presença das cinco tabelas.
3. Homologar admin com Cloudflare Access, autenticação válida, upload múltiplo, remoção e cadastro; testar 12 MiB, 15 MiB, 20 MiB e 50 MiB, PDF inválido e requisição sem tamanho informado.
4. Homologar um combo pequeno real usando cópias autorizadas de PDFs em um rascunho e garantir acessibilidade mobile, integridade visual, paginação e links do arquivo.
5. Verificar **entrega** de todos os PDFs e marca d'água em todas as páginas, especialmente PDF de 50 MiB, com memória de Worker limitada a 128 MiB. Upload aceito não prova personalização ou entrega bem-sucedida.
6. Fazer testes independentes de webhook duplicado, retries, falha parcial no PDF 2/10, e-mail único idempotente, links expirados/revogados e pagamento de valor divergente.
7. CI da branch + smoke de D1 staging + QA E2E precisam estar PASS antes do PR ou produção. Pagamentos reais permanecem desabilitados até homologação financeira N4, avaliação jurídica e confirmação de release específica.
8. Aplicar a **mesma** migração aditiva em D1 de produção em janela aprovada, com backup e rollback definidos **antes** de publicar o código; não modificar clientes/pedidos pagos.

## Contexto de segurança
Na consulta de 12/10/2026, a conexão Cloudflare disponível ao assistente não expôs os bancos D1 do ATPCursos. Nenhuma migração remota foi aplicada por essa conexão. Não confundir infraestrutura de `ATP Simulados` com `ATPCursos`.

## Critério de status
- Código e testes automatizados: auditar por commit e execução CI específica.
- Staging com schema e uploads reais: **BLOCKED** até migração verificada e ambiente autenticado.
- Produção comercial: **BLOCKED** até QA, validação de cobrança/entrega e aprovação de deploy.

## Verificações adicionais de homologação — 12/10/2026
- Cloudflare Pages `atpcursos-staging` recebeu as variáveis `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` e `ADMIN_ALLOWED_EMAILS` nas configurações de preview e production **do projeto de homologação**; nenhuma alteração no projeto Pages de produção.
- Aplicação Cloudflare Access `ATPCursos Staging Admin` já protege `/adm`, `/adm/*` e `/api/admin/*` no domínio `staging-atpcursos.cronogramaatp.com.br`; sessão de administrador exige JWT verificado no backend.
- D1 staging: cinco tabelas de multi-PDF já presentes; bucket R2 `atpcursos-staging-pdfs` identificado.
- QA isolado em máquina de desenvolvimento: 41/41 testes automatizados e 11/11 verificações integradas simuladas PASS para inclusão de dois PDFs, catálogo, bloqueios, personalização, tokens de download e idempotência, sem cobrança/e-mail real.
- A rota `/health` de Pages staging responde 200 com `ready:true`. Cloudflare Pages é a plataforma de deploy; ausência do nome em Workers Scripts não constitui ausência de implantação.
- **PENDENTE / NÃO LIBERAR PRODUÇÃO:** uma nova publicação de staging para incorporar env vars, autenticação administrativa real, upload E2E com PDFs no R2 staging, validação de falhas parciais e da infraestrutura de reprocessamento, verificação de checkout/entrega financeira e Quality Gate PASS.
- Esta atualização é documentação de QA para disparar o pipeline da branch de homologação. Não habilitar checkout real na homologação.
