# atpconcursos — TASKS (plano de implementação verificável)
Versão 2.0 | 29/10/2026 | Todos os itens abaixo estão TODO até teste/registro de evidência.
Responsáveis lógicos: Orquestrador, Engenharia, Integrações, UX e Auditor/QA. Papéis não significam subagentes executados.

## Padrão de execução de cada tarefa
1. Ler PRD.md, ARCHITECTURE.md, RULES.md, DESIGN.md e estado atual do arquivo afetado.
2. Definir contrato de entrada/saída e teste que inicialmente falha.
3. Implementar mudança mínima em branch isolada, jamais direto na main.
4. Rodar teste específico, npm test, npm run build e npm run build:pages; schema_smoke onde houver SQL.
5. Auditor independente revisa segurança, regressões, permissões, dados e visual, conforme escopo.
6. Registrar commit/CI/log/screenshot ou evidência equivalente em MEMORY.md; status PASS, PARTIAL, FAIL ou BLOCKED.
7. Merge e deploy são ações distintas; não autorizar N4 com base somente em CI.

## Fase A — Linha de base e marca
### ATP-00 — Baseline e integridade (P0)
**Arquivos:** package.json, src/index.ts, migrations/0001–0005, docs/PROJECT_MEMORY.md, .github/workflows/qa.yml.
- [ ] Conferir árvore GitHub e commit 8a301d0e2ffb; criar ambiente local limpo a partir da main e branch de mudança.
- [ ] Executar npm ci, npm run build, npm run build:pages, npm test, python3 tests/schema_smoke.py, npm audit --omit=dev --audit-level=high.
- [ ] Auditar staging/production Cloudflare (sem mostrar segredos), backups/restauração D1 e inventário dos objetos R2.
- [ ] Registrar testes atuais e falhas pré-existentes antes da primeira alteração.
**Gate:** baseline reproduzível, nenhuma migração/destruição em produção.

### ATP-01 — Branding completo atpconcursos (P1; depende de ATP-00)
**Arquivos:** src/ui.ts, src/seo.ts, src/design.ts, src/sales-pages.ts, src/client.ts, public/brand/*, public/manifest.webmanifest, testes de branding.
- [ ] Localizar todos os nomes ATPCursos/Até a Posse em conteúdo comercial, OG, e-mails, PWA e títulos; distinguir texto histórico/nomes técnicos de cópia pública.
- [ ] Derivar assets da logo fornecida, preservando geometria do triângulo e seta, trocando apenas cores/acabamento aprovados.
- [ ] Implantar exclusivamente os dez tokens de cor do DESIGN.md e corrigir contraste dos botões/cinza.
- [ ] Validar em mobile/desktop, favicon, PWA, OG, alt-text e todos os links.
**Gate:** nenhuma referência comercial incorreta, logo geometria idêntica e QA visual aprovado. Não concluir marca se novos assets ainda não estiverem aprovados.

### ATP-02 — Subdomínio e transição de URLs (N4; depende ATP-01 + staging aprovado)
**Alvos:** Cloudflare Pages custom domains, zona cronogramaatp.com.br, Access, PUBLIC_BASE_URL, SEO, endpoints, e-mails.
- [ ] Verificar conflito DNS/Access/wildcard e rotas existentes.
- [ ] Testar em staging com domínio isolado e HTTPS.
- [ ] Preparar adição de atpconcursos.cronogramaatp.com.br ao Pages; atualizar rotas e integrações na ordem correta; conservar domínio antigo no período de transição.
- [ ] Definir redirecionamento e compatibilidade de links tokenizados, sem permitir vazamento de tokens em referer.
**Gate:** URL nova com TLS, HTML/API/cookies/Access/SEO corretos; sem afetar outro projeto. Execução N4 somente com aprovação.

## Fase B — Acessos
### ATP-03 — PIN de aluno (P0; depende ATP-00)
**Arquivos:** src/domain/customer.ts, src/customer-public.ts, src/customer-admin.ts, src/admin-customers-ui.ts, tests/customer.test.ts; migração só se comprovadamente necessária.
- [ ] Escrever testes de PIN como string; 8 números incluindo 00001234 válidos; 7/9 dígitos e caracteres não numéricos inválidos.
- [ ] Ajustar criação/troca/reset/login para exatamente 8; migrar credenciais legadas por redefinição verificada, sem insegurança retroativa.
- [ ] Garantir sal+KDF, bloqueio progressivo e limite por IP/identidade, cookie seguro, logout/revogação.
- [ ] Rodar testes contra enumeração de contas, replay de link, sessão expirada e login concorrente.
**Gate:** fluxo de conta do aluno validado em staging sem bypass.

### ATP-04 — PIN individual ADM com Access (P0; depende ATP-03)
**Arquivos:** src/infra.ts, src/index.ts, src/admin.ts, src/ui.ts, novo módulo pequeno de PIN ADM e migração versionada se necessária.
- [ ] Escrever testes de negação: sem JWT Access 403, Access válido sem PIN não acessa API, PIN sem Access não acessa, sessão expirada negada.
- [ ] Associar hash de PIN por identidade Access autorizada, sem PIN padrão/compartilhado.
- [ ] Proteger **todas** rotas /api/admin/* no servidor, incluir limite de tentativas e reautenticação para ações sensíveis.
- [ ] Garantir setup/reset seguro apenas após Access e confirmação adicional; registrar auditoria.
**Gate:** nenhum endpoint administrativo expõe PII sem Access+PIN e rate limit efetivo.

## Fase C — Produtos e conversão
### ATP-05 — Catálogo e arquivos múltiplos (P0; depende ATP-00)
**Arquivos:** src/admin.ts, src/product-files.ts, src/client.ts, src/ui.ts, tests/multi-pdf.test.ts, tests/catalog.test.ts.
- [ ] Reproduzir erro real: combo com 8 arquivos e products.original_key nulo é rejeitado por quote().
- [ ] Corrigir critério único de elegibilidade para product_files aprovados, preservando legado se necessário.
- [ ] Auditar e recuperar contagem de páginas dos PDFs existentes sem sobrescrever originais.
- [ ] Completar formulário/rotas de editar título, preço, descrição, ordem, inclusão e remoção de arquivos, sem publicar automaticamente.
- [ ] Testar arquivos faltantes, PDF inválido, grandes, duplicados, 1/8/20 arquivos, preço e quantidade.
**Gate:** quote aceita combo íntegro e rejeita incompleto; admin manipula 8 arquivos sem perder nenhum.

### ATP-06 — Revisão editorial do catálogo (P0; depende ATP-05)
**Alvo:** D1/R2 de staging e, após autorização, recursos próprios de produção.
- [ ] Conferir 8 arquivos Itanhaém e 8 Mauá, páginas, conteúdo e gabaritos, licença e tamanho.
- [ ] Localizar ou receber PDFs reais de Paulínia, Guarulhos e São Gonçalo; nunca gerar material fictício para “completar” a loja.
- [ ] Verificar preço informado, capas, descrições e disponibilidade; publicar somente produtos aprovados.
**Gate:** pacote 8/8 auditado editorialmente, página correta; faltantes ficam draft.

### ATP-07 — Checkout atômico e preços (P0; depende ATP-05)
**Arquivos:** src/checkout.ts, src/domain/pricing.ts, src/domain/infinitepay.ts, tests/checkout-gate.test.ts, tests/infinitepay.test.ts.
- [ ] Teste RED: uma falha ao criar order_item_files não pode deixar pedido parcial utilizável.
- [ ] Pré-validar catálogo/arquivos; usar gravações atômicas D1.batch conforme contrato verificado, com IDs únicos e snapshots imutáveis.
- [ ] Conferir desconto, valor no backend, múltiplos produtos, replay, duplicidade, URLs não oficiais e rejeição de IDs inválidos.
**Gate:** nenhuma ordem parcial ou cobrança possível por valor divergente; CHECKOUT_ENABLED ainda false.

## Fase D — Integrações, PDFs e reenvios
### ATP-08 — InfinitePay e webhook exclusivo (P0; depende ATP-07)
**Arquivos:** src/checkout.ts, src/domain/infinitepay.ts, testes de webhook e reconciliação.
- [ ] Confirmar conta/merchant autorizado e contrato atual InfinitePay. Não assumir segredo disponível em outro Worker.
- [ ] Manter rota exclusiva /api/webhooks/infinitepay nesta aplicação, referenciada pela URL pública correta; sem redirecionamento para o webhook CronogramaATP.
- [ ] Testar evento falso, duplicado, fora de ordem, reembolso, valor alterado e confirmação /payment_check; correlacionar pedido somente com banco próprio.
- [ ] Usar simulação para rotina; compra real somente com autorização N4.
**Gate:** pagamento só marcado após verificação remota válida; exatamente uma entrega por pedido.

### ATP-09 — Resend e entrega de bundles (P0; depende ATP-08)
**Arquivos:** src/bundle-fulfillment.ts, src/fulfillment.ts, src/pdf-personalize.ts, src/customer-admin.ts.
- [ ] Reutilizar conta Resend, com remetente permitido no domínio verificado e credencial própria da loja.
- [ ] Testar personalização com nome acentuado e diferentes páginas; 1, 8 e 20 PDFs, limites de arquivo e Worker.
- [ ] Idempotência, links limitados, replay, falhas parciais e estado consistente; garantir 8/8 downloads e nenhuma origem R2 exposta.
- [ ] Testar envio e recebimento reais em e-mail de homologação autorizado; registrar sucesso/erro sem PII nos logs.
**Gate:** 8/8 arquivos baixados corretamente por comprador autorizado, segundo e-mail não é duplicado sem necessidade.

### ATP-10 — Rotina programada de recuperação (P0; depende ATP-08/09)
**Arquivos:** src/checkout.ts, entrypoint Worker agendado isolado somente se cron inexistente, tests/reconcile.test.ts.
- [ ] Verificar trigger real e gaps antes de adicionar componente.
- [ ] Criar Worker mínimo Cloudflare Cron Trigger com binding exclusivo, secret escopado e trabalho idempotente caso necessário.
- [ ] Testar interrupção de webhook/Resend e recuperação verificável, com métricas e alarmes.
**Gate:** recuperação comprovada sem tocar projetos vizinhos.

## Fase E — Operação e experiência
### ATP-11 — Biblioteca do aluno (P0; depende ATP-03/09)
**Arquivos:** src/customer-public.ts, src/admin-customers-ui.ts, src/index.ts, teste de autorização.
- [ ] Exibir compras e cortesias do aluno, com acesso somente por identidade confirmada e permissão servidor.
- [ ] Mostrar pedido pendente, pago, entregue e falha; oferecer segunda via conforme regras aprovadas e limites.
- [ ] Teste IDOR: comprador A nunca lista/baixa compra de B; sem enumerar e-mails.
**Gate:** compras reais aparecem e links renovados não violam privacidade.

### ATP-12 — Administração completa (P1; depende ATP-04/05/11)
**Arquivos:** src/admin.ts, src/admin-customers-ui.ts, src/client.ts, src/ui.ts.
- [ ] Gerenciar alunos, reset PIN, cortesias, pedidos, falhas e reenvio controlado, com trilha de auditoria.
- [ ] Disponibilizar métricas reais e estados vazios/erro, compatíveis com mobile e desktop.
**Gate:** operações verificadas com Access+PIN e sem vazamento de dados.

### ATP-13 — Segurança jurídica, UX e SEO (P0/P1; depende ATP-01/11)
**Arquivos:** src/seo.ts, src/design.ts, src/ui.ts, src/sales-pages.ts, src/index.ts, páginas legais.
- [ ] Implantar termos, privacidade, suporte e reembolso com dados legítimos e revisão jurídico-comercial.
- [ ] Auditar WCAG AA, contraste, foco, zoom, telas 320/375/390/768/1440, CTAs, formulários e estados.
- [ ] Atualizar dados estruturados, sitemap, robots/noindex, canonicals, OG e novos domínios após publicação autorizada.
**Gate:** todos CTAs/links funcionais; nenhum P0/P1 de UX/segurança; textos legais aprovados.

## Fase F — Quality Gate e release
### ATP-14 — CI, E2E, independência (P0; depende ATP-03 a ATP-13)
**Arquivos:** .github/workflows/qa.yml, testes novos de integração/Playwright, docs/RELEASE-GATE.md.
- [ ] Adicionar CI no push da main, mantendo PR e npm audit; sem deploy automático sensível.
- [ ] Testes E2E de catálogo, PIN, Access, compra simulada, webhook, 8 PDFs, reenvio, revogação, reembolso e rotas inválidas.
- [ ] OWASP, secret-scan, dependências, migrações, segurança da R2, checagem de isolamento de banco e recursos Cloudflare.
- [ ] **Bloqueio confirmado em CI (PR #8):** a tarefa MCP de npm audit --omit=dev --audit-level=high falhou em 29/10: 8 vulnerabilidades (4 high, 4 moderate) em @modelcontextprotocol SDK/client/server e transitivas body-parser, fast-uri, ip-address, qs. Reproduzir em clone isolado, determinar cadeia de versões, aplicar atualização mínima compatível em mcp/package.json e mcp/package-lock.json, revisar mudanças no protocolo OAuth/transporte e repetir testes MCP, integração e audit. NÃO usar npm audit fix --force sem análise de compatibilidade.
- [ ] Verificar no commit candidato: build, schema, unit/integration, audit, Playwright, uptime, performance e screenshots.
**Gate:** PASS técnico e independente; sem pendências P0/P1, QA confirmado em versão única.

### ATP-15 — Homologação financeira e migração do domínio (N4; depende ATP-02/14)
- [ ] Preparar backup/teste de rollback e congelar SHA candidato.
- [ ] Confirmar Resend e InfinitePay no ambiente da própria loja, sem copiar segredos de outro projeto.
- [ ] Mediante autorização expressa, executar transação real controlada e verificar valor recebido, webhook, 8 arquivos, entrega e eventual estorno.
- [ ] Revisar HTTPS/domínio, links legados, Access, logs e e-mails.
- [ ] Liberar CHECKOUT_ENABLED=true somente após gate comercial/jurídico PASS e aprovação explícita; monitorar operação.
**Gate:** transação ponta a ponta comprovada, rollback disponível, aprovação final registrada.

## Dependências principais
ATP-00 -> ATP-03 -> ATP-04
ATP-00 -> ATP-05 -> ATP-06
ATP-05 -> ATP-07 -> ATP-08 -> ATP-09 -> ATP-10
ATP-03 + ATP-09 -> ATP-11 -> ATP-12
ATP-01 -> ATP-02; ATP-01 + ATP-11 -> ATP-13
ATP-03..13 -> ATP-14 -> ATP-15

## Matriz de status inicial
| Código | Status | Evidência pendente |
|---|---|---|
| ATP-00 a ATP-05 | TODO | baseline/brand/domínio/autenticação/catálogo |
| ATP-06 | BLOCKED | arquivos reais e revisão editorial |
| ATP-07 a ATP-14 | TODO | testes de checkout, integrações, aluno, UI, QA |
| ATP-15 | BLOCKED | autorização N4, credenciais e gate financeiro |

Não converter TODO em DONE por declaração; atualizar cada linha após executar o teste e incluir SHA/evidência.
