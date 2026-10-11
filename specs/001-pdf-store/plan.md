# Implementation Plan — ATPCursos PDF-only

**Estado:** aprovado para desenvolvimento em branch; deploy real bloqueado até gate.

## Stack
- Frontend: React + Vite + TypeScript (ou framework mínimo equivalente), design tokens próprios; Cloudflare Workers static assets/Pages conforme compatibilidade verificada; não usar stack pesada para uma loja de PDF.
- APIs: Cloudflare Worker separado ou routes do mesmo app com bindings nativos.
- Data: D1 exclusivo para catálogo, pedidos, eventos e entregas; migrations versionadas.
- Arquivos: R2 privado exclusivo, prefixos `originals/`, `previews/`, `personalized/`; nenhum domínio público para originais/personalizados.
- Personalização: `pdf-lib` com fonte embutida com suporte aos acentos/Unicode; medir RAM/CPU/limites reais do Worker. PDFs grandes passam por fila/workflow/out-of-band validado.
- Transacional: InfinitePay Checkout Integrado API (endpoint e formato validados na documentação oficial) + `payment_check` como autoridade; Resend API com domínio SPF/DKIM/DMARC validado.
- Admin: Cloudflare Access protegendo endpoints administrativos, auth de função/identidade no servidor e auditoria.
- Fila: usar Cloudflare Queues se geração/envio superar ciclo HTTP; job idempotente por `order_id + version_id`.

## Fluxo seguro
1. Publicar produto/versionamento no admin depois de QA do PDF e preview.
2. POST /api/orders recebe nome/email e `product_ids`; valida e busca valores D1 (nunca aceita valores do cliente), faz snapshot dos itens e grava pending.
3. Worker gera checkout InfinitePay com identificador único e URL webhook/retorno.
4. POST /api/webhooks/infinitepay recebe evento não confiável: validar esquema/tamanho, correlacionar order_nsu, observar replay. Enfileirar checagem, devolver resposta rápida.
5. Verificação server-to-server (payment_check) usando IDs da transação; status/valor/merchant comparados com D1. Transição transacional pending→verified_paid e inserção única de fulfillment.
6. Job obtém R2 private PDF, aplica nome/e-mail em **todas** páginas com opacidade reduzida e assinatura discreta, realiza QA de integridade, grava personalized.
7. Cria download token de alta entropia, armazena hash, manda e-mail Resend após persistência; retries idempotentes e registro de falha.
8. GET /d/<token> valida expiração, uso, revogação e pagamento, entrega stream privado com `no-store`, sem expor R2, e contabiliza.
9. Cancelamento/estorno revoga tokens conforme política aprovada.

## Segurança operacional
- Secrets Cloudflare: `INFINITEPAY_HANDLE`/credenciais se realmente exigidas, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, admin Access, opcional `TURNSTILE_SECRET_KEY`. Nomes e permissões serão ajustados após confrontar docs e estado real. Jamais buscar valores em repositório ou copiar segredo público.
- CI: typecheck, unit/integration, OWASP dependency + secrets scan, teste render PDFs com nome Unicode, simulação de webhook, E2E em preview.
- D1 transactions/unique constraints para `provider_order_nsu`, eventos e delivery; reforçar com ordenação e retries adequados ao D1.
- Observabilidade: métricas por pedido, pagos verificados, personalização, e-mails e download; rastrear por IDs anônimos e redigir dados pessoais.
- Direitos: armazenar prova de autoria/licença e registro de versões.

## Gate progressivo
G0 fontes/provedor/licenças/ambiente -> G1 protótipo visual + contratos API -> G2 testes locais com mock checkout -> G3 homologação de callbacks sem dinheiro real -> G4 secrets + recursos dedicados com confirmação -> G5 canary -> G6 deploy público.

## Design
Navy #0F2D52, azul #1E5AA8, branco #FFFFFF, dourado #C8A24D, gelo #F4F6FA, cinza texto #2B2B2B. CTA primário destacado (azul; contraste medido), dourado apenas para valor/prestígio. Usar logo metálico ATP e mascotes enviadas sem reinterpretação, depois de adicionar arquivos licenciados.
