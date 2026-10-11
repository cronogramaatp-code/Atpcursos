# ATPCursos — Release Gate de homologação

**Atualização:** 11/10/2026
**Ambiente em execução:** nenhum Worker ATPCursos publicado. Conta Cloudflare possui D1 `atpcursos-staging-db` e R2 `atpcursos-staging-pdfs`, dedicados.

## Já implementado e verificado localmente
- Loja pública, páginas individuais, admin separado por Cloudflare Access (lógica de verificação; configuração real pendente).
- Catálogo, upload de PDF em rascunho, descontos progressivos 20/30/40/50 sem acúmulo, upsell e métricas.
- InfinitePay: geração de checkout e validação server-to-server; aceita hostname `checkout.infinitepay.com.br` da documentação brasileira; rejeita URLs falsas.
- PDF: marca d'água original com nome/e-mail usando Noto Sans Unicode (SIL OFL v1.1), em todas as páginas. Fonte disponível como ativo estático, PDF pago mantido exclusivamente em R2 privado.
- Envio Resend e tokens temporários, código presente; integração real ainda não homologada.
- Web/PWA: logo ATP, favicon, ícones, OpenGraph, service worker com rede primeiro para assets e exclusão de rotas privadas do cache.
- Testes unitários, migrações SQLite e Wrangler `--dry-run` realizados localmente; sem tentativa de dinheiro real.

## Itens bloqueadores do go-live
1. **Hospedar staging**: ativar autenticação Wrangler ou realizar deploy dedicado pelo conector Cloudflare com revisão de artefatos e rollback.
2. **Confirmação de pagamento**: testar InfinitePay `payment_check`, replays, duplicatas, valores divergentes, reembolsos e checkout completo com conta comerciante real em ambiente apropriado.
3. **Resend**: configurar remetente, domínio verificado e teste real de entrega/segunda via; sem expor API keys.
4. **Admin**: configurar Cloudflare Access, AUD e allowlist; testar login válido/inválido, CSRF e upload de PDF não confiável.
5. **MCP**: conectar outra conta por OAuth, conferir isolamento e testes autenticados (atualmente apenas fail-closed).
6. **Dados/negócio**: cadastrar material original licenciado, configurar preços, domínio oficial, política de reembolso, termos, privacidade e dados da empresa.
7. **QA ponta a ponta**: navegadores móveis, Pix/cartão, R2 personalizado com marca d'água, e-mail e download expirado/revogado.
8. **Liberação**: PR revisado por pessoa independente; status `PASS`; ativação de produção separada de homologação.

## Normas inegociáveis
- Não marcar pedido como pago por redirect ou payload de webhook sozinho.
- Não publicar originais pagos no bucket público nem registrar PII em log.
- Não reutilizar sem análise credenciais nem dados do cronograma ATP/Cripto.
- Não alterar DNS, segredos ou cobrar em produção como etapa implícita.
- Não confundir o sucesso local de build com site publicado.

## Links de referências verificadas
- InfinitePay oficial: https://www.infinitepay.io/checkout-documentacao
- Cloudflare Assets fetch: https://developers.cloudflare.com/workers/static-assets/binding/
- pdf-lib + @pdf-lib/fontkit: https://github.com/Hopding/pdf-lib
- Fonte Noto Sans: https://github.com/notofonts/noto-fonts

## Evidências de QA adicionais — 11/10/2026
- **Commit da correção funcional:** `0cb06201043fc0a2fd810d9fc6b82304955a338e`. GitHub Actions concluiu com sucesso.
- **Loja:** 21 testes Node/TypeScript passaram; **MCP:** 4 testes de bloqueio/autenticação passaram.
- **Testes de esquema:** 3 migrações aplicadas ao SQLite/D1 local isolado, com validação de cortesia sem receita.
- **HTTP em Worker local real:** 13 verificações aprovadas (saúde, home, produto, manifesto, favicon, ícone, imagem social, fonte Unicode, script, catálogo, admin bloqueado, portal do comprador e checkout bloqueado no staging). Worker encerrado ao final.
- **Staging D1 remoto:** confirmou-se ausência de `customer_login_limits`; foi executado exclusivamente `CREATE TABLE IF NOT EXISTS customer_login_limits (...)` conforme `0003_login_throttle.sql`, com nova consulta confirmando a tabela. Nenhum pedido, cliente ou pagamento modificado. A trilha de `d1_migrations` ainda precisa ser conferida antes de futuras migrações remotas.
- **Métricas de qualidade:** `npm audit --omit=dev --audit-level=high` sem vulnerabilidades reportadas; bundle Wrangler `--dry-run` gerado incluindo arquivos do PWA, marca e Noto Sans.
- **Sincronização:** GitHub e duas pastas locais do VAIO validados com hashes coincidentes para os arquivos rastreados.
- **Falta:** Worker não publicado; InfinitePay e Resend reais e OAuth da outra conta ChatGPT continuam não homologados. Quality Gate global: **PARTIAL**.

## Cloudflare Pages staging — 11/10/2026
- Projeto dedicado criado: `atpcursos-staging`, domínio técnico `atpcursos-staging.pages.dev`, origem GitHub `cronogramaatp-code/Atpcursos` na branch `feat/spec-kit-loja-pdfs`.
- Build configurado: `npm run build:pages`, saindo em `dist/_worker.js` e arquivos estáticos. D1 e R2 exclusivos de homologação vinculados; `ENVIRONMENT=staging` bloqueia checkout real.
- Build Pages local validado com teste HTTP, inclusive bloqueio da administração sem Cloudflare Access. A existência do domínio não garante publicação: verificar deploy e SSL antes de marcar PASS.
- O domínio oficial, segredos, e-mails transacionais e OAuth do MCP continuam separados e bloqueados até integração e QA ponta a ponta.

## MCP separado — Cloudflare Pages (11/10/2026)
- Projeto `atpcursos-mcp-staging` criado, origem GitHub `cronogramaatp-code/Atpcursos` com raiz de build `mcp/`, saída `dist/_worker.js` e domínio reservado `atpcursos-mcp-staging.pages.dev`.
- Build `npm run build:pages` validado, 4 testes de segurança, canário HTTP local (saúde 200, acesso anônimo ao MCP 401). Integrado à CI.
- D1/R2 de homologação associados; `ENVIRONMENT=staging`. **OAuth, Cloudflare Access e a permissão da segunda conta ChatGPT ainda não configurados**. Não habilitar operações administrativas remotas sem verificação de identidade.
- Loja `atpcursos-staging.pages.dev` publicada em homologação, com 7 verificações HTTP públicas aprovadas e pagamentos bloqueados.

## Domínios, e-mail e autenticação — estado de homologação
- A loja foi validada por HTTPS em `https://staging-atpcursos.cronogramaatp.com.br/loja`: saúde, catálogo, manifesto PWA e marca respondem HTTP 200. `/adm` e `/api/admin/*` redirecionam a Cloudflare Access (HTTP 302).
- O MCP foi validado por HTTPS em `https://mcp-atpcursos-staging.cronogramaatp.com.br`: `/health` responde HTTP 200 e `/mcp` redireciona a Cloudflare Access (HTTP 302); diretamente em pages.dev permanece fail-closed sem JWT.
- **Roteamento:** o wildcard original `*.cronogramaatp.com.br/*` do Cronograma ATP interceptava os subdomínios. Foram criadas duas exceções MAIS ESPECÍFICAS com `script: null` apenas para `staging-atpcursos.cronogramaatp.com.br/*` e `mcp-atpcursos-staging.cronogramaatp.com.br/*`. Preservar o wildcard dos outros projetos.
- **Cloudflare Access:** aplicações independentes `ATPCursos Staging Admin` e `ATPCursos MCP Staging Owner`, ambas com política de proprietário único. A identidade/allowlist não deve aparecer neste repositório público.
- **Resend:** domínio `atpcursos.cronogramaatp.com.br` verificado na região `sa-east-1`. DKIM TXT, SPF TXT, MX e CNAME necessários foram aplicados na zona Cloudflare e confirmados pelo Resend. Não modificar o domínio de envio preexistente de outro projeto.
- **Gate de secrets BLOCKED:** a tentativa de gravar os segredos na Pages via conexão atual foi bloqueada pelas configurações de segurança da plataforma; nenhuma credencial foi aplicada por essa tentativa. Não contornar, não commitar chaves e não copiar segredos de outras aplicações.
- **Ambientes Pages:** loja e MCP ainda têm apenas `ENVIRONMENT=staging` e bindings D1/R2. Faltam, pelo canal administrativo autorizado: `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ADMIN_ALLOWED_EMAILS`, `BUYER_HASH_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `PUBLIC_BASE_URL` e os parâmetros comerciais da InfinitePay. Configurar separadamente no Worker MCP (Access/AUD do MCP e permissões de desenvolvedor).
- **Não concluído:** envio transacional real, checkout pago/reembolso, PDF comprado entregue, login após Access no app e OAuth do MCP em outra conta ChatGPT. Um status 200 no staging NÃO valida essas operações.
- CI/QA: 21 testes loja, 4 testes MCP, build Pages de ambos e migrações 0001–0003 validados. **Quality Gate global: PARTIAL**. PR continua draft e produção/cobrança continuam desativadas.

## Registro de continuidade — alertas de venda e acesso

- Cloudflare Access da homologação: política `atpcursos-owner-only` agora permite a conta administrativa existente e a nova conta autorizada pelo proprietário. Nenhum login por senha fixa foi implementado: o painel usa Access/OIDC e ainda exige configuração segura de `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` e `ADMIN_ALLOWED_EMAILS` no ambiente do Worker.
- Nova migração `0004_sale_alerts.sql`, aplicada e lida no D1 de staging (tabelas `store_settings` e `sale_alerts`). O endereço administrativo para avisos de venda fica na tabela privada `store_settings`, fora do repositório. Mensagem só após `payment_check` pago; envio duplicado bloqueado por pedido e retry controlado.
- Rotina de alertas no commit `542fa06`; testes de falha do provedor, repetição de webhook e pedido pendente no commit `b44527a`. CI GitHub PASS, 27 testes da loja PASS, migrações locais PASS e duas pastas VAIO sincronizadas.
- Loja HTTPS staging publicada e funcional em `https://staging-atpcursos.cronogramaatp.com.br/loja`. Admin redireciona ao Cloudflare Access, mas o Worker continua fechado enquanto não houver variáveis de autenticação no ambiente. MCP staging retorna HTTP 401 sem token e precisa de OAuth configurado antes de ser conectado à outra conta ChatGPT.
- Resend: subdomínio remetente verificado; **não há `RESEND_API_KEY` no ambiente Pages**. Portanto, alertas automáticos ainda não foram enviados na prática. Credenciais não devem ir para Git, chat ou logs. Tentativa anterior de gravar segredos por conector foi bloqueada por controles de segurança; não contornar esse bloqueio.
- Nenhuma compra real, e-mail transacional de produção ou senha administrativa fixa foi ativada. Quality Gate global continua **PARTIAL**. Não liberar compras, publicar PR em `main` nem marcar conexão MCP como aprovada sem os testes autenticados correspondentes.
