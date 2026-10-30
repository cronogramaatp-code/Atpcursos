# atpconcursos — ARCHITECTURE (arquitetura e integração)
Versão 2.0 | 29/10/2026 | Plano, sem migração/deploy executados.

## 1. Arquitetura preservada
Frontend HTML/JS e CSS atual -> Cloudflare Pages (atpcursos-producao), com Worker TypeScript src/index.ts -> D1 próprio (produtos, clientes, pedidos, logs, sessões) + R2 privado próprio (originais e PDFs personalizados).
src/checkout.ts -> InfinitePay /links, /payment_check, webhook /api/webhooks/infinitepay.
src/bundle-fulfillment.ts / src/fulfillment.ts / src/pdf-personalize.ts -> R2 + Resend.
src/customer-public.ts / src/customer-admin.ts -> aluno e cortesias.
src/admin.ts / src/product-files.ts -> operações de catálogo.
src/design.ts / src/ui.ts / src/client.ts / src/sales-pages.ts / src/seo.ts -> apresentação.
src/infra.ts -> JWT Cloudflare Access e validações.

Não adicionar framework, D1 compartilhado nem R2 público.

## 2. Divisas operacionais de independência
- Repositório de código permanece cronogramaatp-code/Atpcursos nesta primeira etapa. Renomear o repositório, se desejado, será uma operação posterior com revisão de links, GitHub Actions e integrações; não necessária para mudar marca.
- Cloudflare Pages: manter o projeto independente atpcursos-producao e homologação atpcursos-staging; o nome interno pode ser renomeado depois, sem exigir reconstrução.
- D1: conservar bases distintas para produção e staging; R2: buckets privados próprios. Não executar query cruzada em bases CronogramaATP.
- Resend: utilizar a conta existente e o domínio de envio verificado atpcursos.cronogramaatp.com.br, com credencial de escopo mínimo própria para atpconcursos. Exibição do remetente atualizada para a nova marca; mudança futura do domínio de envio depende de verificação DKIM/SPF/DMARC.
- InfinitePay: mesma conta comercial se validado pelo proprietário, mas webhook em https://atpconcursos.cronogramaatp.com.br/api/webhooks/infinitepay (após ativação do domínio), identificação de pedidos exclusiva e confirmação payment_check. Não redirecionar webhook de outro produto para esta loja.
- Nenhuma credencial deve ser copiada para GitHub/PR/arquivo de plano ou exibida em logs.

## 3. Novo domínio e transição
Estado atual: atpcursos.cronogramaatp.com.br está conectado ao Pages; atpconcursos.cronogramaatp.com.br não possuía registro DNS verificado em 29/10/2026.
Plano: (a) confirmar disponibilidade e regras existentes de wildcard/Access; (b) adicionar domínio personalizado ao mesmo projeto Pages; (c) configurar/validar DNS, TLS e rota; (d) testar páginas, APIs, checkout desativado e segurança dos cookies; (e) atualizar PUBLIC_BASE_URL, URLs nos e-mails, SEO, sitemap, canonical, PWA e regras Access; (f) somente após smoke preservar antigo hostname com redirecionamentos 301 adequados para rotas públicas e tratamento seguro para links tokenizados. Nunca apagar antigo antes de confirmar recuperação de links existentes.
Staging poderá ganhar staging-atpconcursos.cronogramaatp.com.br; não quebrar endereço existente até homologação.
Ações N4 (DNS, Access, deploy, segredos) dependem de gate separado.

## 4. Identidade e senha de 8 dígitos
Aluno: e-mail normalizado + PIN como string de 8 caracteres numéricos (regex ^[0-9]{8}$); zeros à esquerda preservados. Utilizar verificação com sal e KDF existente, sem armazenar PIN reversível. Ajustar src/domain/customer.ts, src/customer-public.ts, src/customer-admin.ts, UI de login e reset, com migração segura de contas legadas. Impor limites de tentativa por conta e IP/abuso, bloqueio gradual, feedback genérico, cookies HttpOnly Secure SameSite, rotação e logout real.
ADM: manter validação JWT em Cloudflare Access, allowlist e MFA quando possível. Adicionar PIN **individual**, sessão de confirmação vinculada à identidade Access e expiração curta; backend valida ambas condições em todas as APIs admin; reset do PIN sob identidade forte, sem chave mestra e sem PIN padrão. O PIN não substitui Access.
Proteções testadas contra bypass, IDOR, replay, brute force e CSRF.

## 5. Catálogo, D1 e snapshots
Gargalo confirmado: produtos combo com oito product_files e products.original_key nulo, enquanto quote() exige original_key; trocar regra de disponibilidade pela existência e validação dos arquivos product_files (ou modo legado somente para itens individuais com arquivo real). Confirmar execução em testes, não apenas alterar condição.
Metadados: page_count de produtos/arquivos zerado; reprocessar de forma segura originais verificados sem alterar bytes, guardar número de páginas efetivo e sinalizar revisão pendente para PDF não parseável/tamanho alto.
Admin deve editar rascunhos, listar, adicionar, remover, ordenar, atualizar título, descrição, capa e preço com histórico; somente publicar item que passou validação editorial.
Checkout: validar todos arquivos e produtos primeiro; gravar pedido, itens e order_item_files em transação/execução atômica via D1.batch, sem pedidos parciais; snapshots imutáveis garantem entrega de originais comprados.

## 6. Pagamentos
Cliente -> POST /api/quote -> POST /api/checkout -> link oficial InfinitePay.
Webhook -> validação formal e registro de evento, sem marcar pago por conta própria -> /payment_check server-to-server -> comparar valor, pedido, merchant, status e referência -> transição condicional pending->paid -> processamento idempotente e rastreável.
Testes: duplicidade, fora de ordem, adulteração de valor, latência do provedor, cobrança criada mas webhook ausente, reembolso e links falsos.
O prefixo e a associação de pedidos com atpconcursos devem ser exclusivos; nenhuma transação deve impactar outro domínio/produto.
Ainda não confirmado um segredo INFINITEPAY em produção CronogramaATP; a integração real dependerá da configuração permitida no ambiente da loja.

## 7. Entrega e reconciliação
Todos os PDFs de um combo precisam ser personalizados, mantidos privados e entregues ao mesmo comprador por links temporários. Verificar execução em itens de 1, 8 e 20 arquivos; evitar e-mails repetidos em retries. Estados sent/processing/error/revoked auditáveis. Não usar URL pública direta de R2.
Worker agendado separado para recuperar pedidos/eventos/entregas pendentes somente após confirmar se existe mecanismo equivalente. Cron deve consumir apenas D1/R2 da loja, com logs sem dados pessoais e backoff/limites.
PDF grande exige medição real do uso de memória/CPU; Queues/Workflows apenas se testes demonstrarem necessidade.

## 8. Banco, segurança e rollback
Criar migrações incrementais compatíveis com migrations/0001_initial.sql até 0005_multi_pdf_bundles.sql. Verificar tabelas existentes antes de DDL. Nunca criar usuários do admin com PIN hardcoded. Backups de D1, versão do Pages e inventário do R2 antes de escrita em produção.
Promover alterações por pull request -> CI -> staging -> testes E2E e segurança -> avaliação independente -> canário -> aprovação -> produção. Não alterar CHECKOUT_ENABLED=false até gate financeiro explícito.

## 9. Pontos de implementação
| Etapa | Código principal | Evidência |
|---|---|---|
| Marca/rotas | src/ui.ts, src/seo.ts, src/design.ts, public/brand | HTTP + screenshot + branding tests |
| PIN aluno | src/domain/customer.ts, src/customer-public.ts, src/admin-customers-ui.ts | teste de credencial, bloqueio e reset |
| PIN ADM | src/infra.ts, src/index.ts, novo módulo mínimo e migração | Access+PIN obrigatório |
| Produtos | src/admin.ts, src/product-files.ts, src/client.ts | CRUD 8 PDFs + metadados |
| Checkout | src/checkout.ts, src/domain/infinitepay.ts | transação/valor/idempotência |
| Entrega | src/bundle-fulfillment.ts, src/pdf-personalize.ts | 8 de 8 PDFs, email confirmado |
| Biblioteca | src/customer-public.ts | compras + cortesias autorizadas |
| Automação | worker de conciliação só se necessário | Cron real rastreável |
| Release | .github/workflows/qa.yml, docs/RELEASE-GATE.md | build, testes, E2E, rollback |

## 10. Limitações registradas
Graphify não disponibilizou workspace consultável; não declarar grafo validado. Publicação DNS e checkout real ainda não realizados. O plano não equivale a implementação.
