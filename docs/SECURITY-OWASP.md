# Segurança, LGPD e Quality Gate — ATPCursos

## OWASP baseline
Verificar OWASP Top 10 e API Security Top 10 contra superfícies reais: create-order, webhook, download, reenvio, upload/admin e storage. Referenciar ASVS como checklist de controle, não fingir certificação externa.

| Risco | Mitigação | Caso de teste obrigatório |
|---|---|---|
| Acesso quebrado / IDOR | Admin autenticado e autorizado, token de download opaco, R2 privado, checagem de pedido pago | Mudar id de pedido e tentar baixar documento de outra pessoa |
| Webhook falsificado | Tratar corpo como não confiável; verificação oficial `payment_check` com IDs do pedido e comparação de valores e merchant | POST falso `paid=true` não entrega PDF |
| Replay/concorrência | Eventos idempotentes; UNIQUE em order_nsu, transaction_nsu/delivery, transições atômicas | 20 webhooks iguais → um pagamento e uma entrega |
| Substituição preço | Preço e moeda lidos em D1; snapshot em order_items | Enviar price_cents=1 no request não altera valor |
| Upload perigoso | somente PDFs legítimos, conferência magic bytes/estrutura, tamanho/limites, scanning, quarantine | PDF inválido/malicioso não publicado |
| Vazamento PII | mascarar logs, chaves aleatórias R2, tokens armazenados como hash, no-store | resposta/URL/log sem nome/email |
| Brute force/envio spam | rate-limit por IP e por destinatário, resposta genérica, e-mail apenas após pedido verificado | script de reenvio não enumera compradores |
| Dependências | lockfile, audit, licença, versão fixada, pin hash de executáveis, SCA | detectar pacote vulnerável em CI |
| SSRF / open redirect | URLs externas allowlisted (InfinitePay/Resend), redirect fixo; não buscar URL arbitrária de usuário | links javascript: ou redirect terceiro rejeitados |
| Corrupção PDF | checksum do original e gerado, teste de todas páginas, fonte Unicode | nome com acentos aplicado sem perder texto/links |

## LGPD
Base legal e aviso claros para nome/e-mail processados para compra/entrega e eventual suporte. Política de retenção por finalidade legal/contratual; mínimo necessário e direitos do titular. Evitar marketing opt-in acoplado à compra. Segurança de dados, backups, acesso restrito, registros de auditoria.

## Gate por ambiente
- **N0:** descoberta de ferramentas e fontes (sem instalação).
- **N1:** leitura de GitHub/Cloudflare/VAIO (sem chaves em resposta).
- **N2:** staging/auth em leitura.
- **N3:** escrita em branch e recursos dedicados staging, sem compras reais.
- **N4:** secrets, DNS, produção e dinheiro: evidência dos testes + aprovação de operação.

## Evidência mínima pré-go-live
Run id de CI, hashes PDFs de exemplo, screenshots mobile/desktop, respostas de check payment em sandbox, logs idempotentes anonimizados, testes de expiração e reenvio, autorização de marca/produto, rollback e monitoramento. Crítico independente assina PASS.
