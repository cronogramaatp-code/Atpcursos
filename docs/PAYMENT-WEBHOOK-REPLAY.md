# atpconcursos — Webhooks InfinitePay sem duplicação e conciliação justa

Status: branch isolada; sem merge, checkout ou deploy em produção.
Verificação: 30/10/2026.

## Causa raiz observada
- O webhook inseria `payment_events` usando `uuid()` a cada notificação, mesmo quando o mesmo evento já existia. Repetições ilimitadas podiam lotar as primeiras posições do lote de conciliação.
- A conciliação consultava os dez eventos mais recentes. Sem rotação por tentativas, eventos anteriores podiam ficar indefinidamente fora do lote.
- O recebimento imediato, após confirmação do servidor InfinitePay, não marcava o evento como reconciliado, permitindo conciliação redundante.

## Correção
1. `receiveWebhook` identifica eventos por SHA-256 do conjunto `(order_nsu,transaction_nsu,invoice_slug)`. `INSERT OR IGNORE` na chave primária mantém um único evento para retransmissões da mesma combinação. Alteração legítima do slug origina outro evento. O identificador não depende de e-mail ou dado pessoal.
2. Após `payment_check` confirmar valor exato, `payment_events.status` muda de `received:<slug>` para `reconciled`. Eventos não confirmados permanecem para reprocessamento; o estado do pedido NÃO muda.
3. Nova migração aditiva `0009_payment_event_retries.sql` registra tentativas por ID de evento, incluindo `attempts` e `last_attempt_unix`; o reconciliador seleciona os dez eventos **menos tentados** primeiro, evitando monopolização por notificações antigas incorretas.
4. As verificações obrigatórias de `confirmPayment` permanecem intactas: pagamento confirmado pelo provedor com centavos exatamente iguais ao pedido. Webhook por si só não libera PDF.

## Evidências
- Teste de retransmissão 18 vezes do mesmo evento → exatamente 1 registro, pedido permanece `pending` sem confirmação.
- Teste com 24 eventos falhos e 3 ciclos de conciliação → os 24 entram na fila de tentativas, sem favorecer perpetuamente os dez primeiros.
- Teste de `payment_check` simulado válido → pedido `paid`, evento `reconciled`.
- Teste do valor incorreto → pedido `pending`, evento reprocessável, nenhuma notificação de venda.
- `npm test`: 91/91 PASS; `npm run build`, `npm run build:pages`, `python tests/schema_smoke.py` (0001–0009), `npm audit --omit=dev --audit-level=high` (0 alertas).
- **Cloudflare D1 staging**: banco `atpcursos-staging-db` confirmado por UUID; ponto Time Travel confirmado antes de alterar; tabela `payment_event_retries` e índice criados; preservados 1 rascunho, 10 PDFs e 0 pedidos, clientes e eventos. D1 de produção NÃO alterado.

## Limitações e quality gates
- **CRÍTICO**: validar execução real do agendamento de `reconcile` em produção. A existência de `scheduled()` no código e `triggers.crons` em `wrangler.jsonc` não comprova agendamento para o Pages publicado. A melhoria de justiça só atua quando `reconcile` é chamado.
- Homologar com InfinitePay em ambiente controlado, sem transações reais não autorizadas. Não logar identificadores sensíveis nem expor segredos.
- A migração 0009 precisa ser aplicada ao D1 de produção por fluxo controlado **antes** de publicar a nova versão.
- Não foram realizados deploy de produção, mudança de DNS, ativação do checkout, compartilhamento de credenciais, e-mail real ou transferência de dados entre projetos ATP.
- Como estratégia adicional de evolução, estudar backoff progressivo por erro e métricas de filas; não necessário para esta correção de deduplicação.
