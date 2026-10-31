# atpconcursos — Gates reais para lançamento comercial

**Estado em 31/10/2026:** PARTIAL. O código avançado está em PRs de revisão; não equivale à versão publicada da loja. Não habilitar vendas sem evidência ponta a ponta.

## Identidade e isolamento
- Projeto **atpconcursos**, independente de CronogramaATP, Questões ATP e outras aplicações.
- Repositório: `cronogramaatp-code/Atpcursos`.
- Banco D1, bucket R2 e deploys próprios por ambiente; nenhum dado de outra aplicação pode ser importado, reaproveitado ou excluído.
- É permitido utilizar a mesma **conta do provedor Resend e do estabelecimento InfinitePay**, conforme solicitado pelo proprietário, mas sempre com IDs de pedido próprios, remetente/rota do site verificados e handlers/webhooks segregados. Não copiar segredos entre projetos.
- Nome comercial, paleta e símbolo ATP precisam de revisão de UX e visual final; mudanças de DNS/canonical exigem gate próprio.

## Estado comprovado no Cloudflare D1 de produção (leitura, 31/10/2026)
- **5 produtos**, todos `draft`; **0 publicados**, 16 registros `product_files`.
- **0 pedidos e 0 alunos**.
- `atpcursos-producao`: `CHECKOUT_ENABLED=false` confirmado.
- A aplicação publicada deve ser validada a partir de um deploy cujo campo `environment=production`; um `latest_deployment` de preview não comprova que as correções foram integradas à `main`.
- Sem catálogo publicado e sem teste real de compra, **não há prontidão comercial**.

## Gate 1 — Integrar o código (BLOCKED)
- PRs encadeados desde #8 até #22 ainda estavam em estado DRAFT na última conferência.
- Reconciliar o histórico de branches herdadas, eliminar conflitos e consolidar em um **único release candidate** na branch apropriada.
- CI obrigatório: TypeScript, build Pages, smoke D1 0001–0009, suíte de testes, npm audit, empacotamento dry-run de Worker cron e revisão da diferença efetiva frente à `main`.
- **Não dar merge e não promover automaticamente** apenas porque os testes unitários passaram.

## Gate 2 — Staging de verdade (BLOCKED)
- D1 de staging contém migrações 0001–0009, incluindo registro de tentativas de webhook; migrar produção só depois de backup, inspeção do banco correto e aprovação.
- Configurar no escopo **staging do atpconcursos**: `PIN_PEPPER`, `BUYER_HASH_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `INFINITEPAY_HANDLE` e `PUBLIC_BASE_URL`, além de Cloudflare Access + MFA e allowlist específica.
- Não inserir segredos em Git, arquivos de logs ou documentação. Verificar domínios e remetente.
- Testar PIN do aluno e do ADM (8 dígitos, zeros à esquerda), recuperação de senha, rate-limit, revogação e prevenção de contas cruzadas.

## Gate 3 — Conciliação periódica em Worker próprio (PARTIAL no código)
- `src/reconciler-worker.ts` define Worker **exclusivamente agendado**, sem exposição HTTP funcional: toda requisição recebe 404.
- `wrangler.reconciler.staging.jsonc` define nome próprio, D1 e R2 exclusivos de staging, assets de fonte NotoSans e `*/10 * * * *` (a cada dez minutos, horário UTC).
- `workers_dev: false`, `preview_urls: false`, sem rotas, e `RECONCILIATION_ENABLED: false` garantem que um eventual deploy de homologação comece **sem processar pagamentos**.
- A ativação exige os bindings/segredos certos, `PUBLIC_BASE_URL` de loja atpcursos/atpconcursos autorizado e mudança explícita do flag. Configuração incompleta falha com erro genérico, nunca assume conta ou domínio alternativo.
- **Worker não foi implantado ou habilitado.** Wrangler dry-run e testes de unidade não comprovam execução real do Cron Trigger; inspecionar Worker, triggers, logs e execuções reais em staging antes de declarar PASS.
- Antes de criar agendamento de produção, verificar não existir outro agendador ativo para evitar execução duplicada; manter fallback e rollback.

## Gate 4 — Compra e entrega (BLOCKED)
- Validar com provedor em ambiente controlado: link de checkout, retorno à loja, callback webhook, confirmação `payment_check` de valor exato, deduplicação e reprocessamento automático.
- Para cada pedido: snapshot completo dos PDFs, marca d'água nome/e-mail em todas as páginas, R2 privado, e-mail Resend, links limitados, status de entrega e recuperação de falha de provedor sem duplicar cobranças.
- Testar: pagamento pendente, valor divergente, duplicado, estorno, webhook fora de ordem, e-mail atrasado, PDF ausente e recorrência do Cron.
- **`CHECKOUT_ENABLED` continua false** até a conclusão do Gate 4 e aprovação comercial.

## Gate 5 — Catálogo, legal, visual e suporte (BLOCKED)
- Publicar somente materiais conferidos (páginas, metadados, PDFs completos, licenças/autorizações de uso, preço e capa), corrigir contagens desconhecidas; validação editorial por produto.
- Homologar painel multi-PDF, biblioteca de aluno, compras com troca de e-mail, páginas de vendas 01–04, desconto e admin.
- Finalizar logo ATP sem mudar o símbolo original, paleta oficial, UI mobile, contraste, zoom 200%, acessibilidade, desempenho e mensagens.
- Criar/verificar Política de Privacidade, Termos de Uso, política de entrega/reembolso, contato/suporte e tratamento de dados LGPD com revisão apropriada.
- Configurar subdomínio final do cronogramaatp, SSL, canonical/sitemap, redirecionamentos e SEO após gate DNS.

## Gate 6 — Lançamento assistido (BLOCKED)
- Release candidate identificado por SHA, migrações e segredos conferidos, rollback testado, logs/alertas e painel de pedidos acessíveis.
- Teste controlado de compra e entrega integral, com autorização e conciliação dos valores antes de abrir o checkout ao público.
- Verificar produção, DNS e pagamentos **sem mexer nos outros projetos ATP**.
- Gate = PASS apenas com evidência de execução real em cada etapa; caso contrário PARTIAL/BLOCKED.

## Fontes técnicas oficiais
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Cloudflare Worker static asset bindings](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Cloudflare D1 migrações](https://developers.cloudflare.com/d1/reference/migrations/)
