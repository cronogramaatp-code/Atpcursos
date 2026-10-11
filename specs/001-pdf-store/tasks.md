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


## Adendo 002 — gestão de alunos e cortesias
- [x] S01 Modelo `customers`, `courtesy_grants`, `courtesy_download_tokens`, `customer_action_tokens`, `customer_sessions`.
- [x] S02 UI administrativa `/adm/alunos` com cadastro, pesquisa, liberação, reenvio e revogação.
- [x] S03 API administrador e auditoria de cortesias, e-mail e redefinição de senha.
- [x] S04 Confirmação do novo e-mail por link; conta opcional com senha PBKDF2, sessão HttpOnly e revogação.
- [x] S05 Redução brute force via `customer_login_limits` com janela de 15 minutos.
- [x] S06 Cadastrar automaticamente compradores após confirmação de pagamento.
- [x] S07 Typecheck e testes unitários da lógica principal.
- [ ] S08 Aplicar migrations em D1 dedicado staging e testar end-to-end com Resend e R2.
- [ ] S09 Conectar compra real, testar webhook oficial e validar controle de acesso.
- [ ] S10 Política de reenvio e conteúdo protegido, evidências OWASP, acessibilidade e autorização para deploy.
- [ ] S11 Testes de carga e PDF com Unicode; nenhum dado real em QA.

**Gate: PARTIAL; não marcar conclusão da funcionalidade até testes E2E e publicação verificada.**
