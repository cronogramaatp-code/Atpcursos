# Tasks — 001 PDF Store

Legenda: [ ] pendente; [x] documentação criada; [!] bloqueio/decisão.

## Etapa A — Evidência e identidade
- [x] A01 Confirmar repo GitHub e branch, sem segredos.
- [x] A02 Confirmar provedor InfinitePay correto (Brasil), doc `checkout-documentacao` e `payment_check`.
- [x] A03 Levantar estrutura Cloudflare existente sem mutações.
- [ ] A04 Consolidar imagens logo/mascotes originais no repositório em `public/brand/` com autorização do dono, sem dependência em URLs terceiras.
- [ ] A05 Validar licenças, hashes, origem do Spec Kit, Superpowers, OWASP, Graphify, Ponytail, MCP Codebase e DeepSeek Harness antes de executar dependências.

## Etapa B — Loja
- [ ] B01 Testes UI catálogo/filters/slug e responsividade.
- [ ] B02 Implementar home, pesquisa, cards, página produto e preview limitado.
- [ ] B03 Implementar rotas legais e metadados SEO.
- [ ] B04 Admin autenticado por Access e auditoria.

## Etapa C — Pagamentos (critical)
- [ ] C01 Contrato mock InfinitePay e casos adversariais; documentar `order_nsu`, centavos BRL e idempotência.
- [ ] C02 Modelar migrations D1 + constraints.
- [ ] C03 Criar pedido e link, sem aceitar preço do browser.
- [ ] C04 Implementar webhook verificável + chamada autoritativa `payment_check`.
- [ ] C05 QA independente para spoof, replay, corrida, pagamento parcial, estorno e divergência de valores.

## Etapa D — PDF e e-mail
- [ ] D01 Fixtures PDFs curto, longo, rodado, A4, caracteres acentuados, imagens e links.
- [ ] D02 Implementar watermark todas as páginas, medindo tamanho e memória; compare renders + extração texto.
- [ ] D03 R2 private + tokens hash/TTL/use-count.
- [ ] D04 Resend e-mail em sandbox com domínio verificado; retry e antifraude de reenvio.
- [ ] D05 Controle de falhas + reconciliação diária pagos sem entregas.

## Etapa E — Publicação
- [ ] E01 Smoke tests e threat model OWASP.
- [ ] E02 QA em mobile/desktop e performance.
- [!] E03 Credenciais próprias autorizadas, domain DNS, preços e termos LGPD a confirmar.
- [!] E04 Pagamento real e deploy somente após G4/G5 com verificação independente.
- [ ] E05 Canary 1 produto piloto, rollback, monitoramento.

**Gate atual: PARTIAL (planejamento)**. Nenhuma função de compra real em produção.
