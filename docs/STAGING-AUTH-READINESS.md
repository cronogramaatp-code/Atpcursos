# atpconcursos — Homologação da autenticação (D1 staging)

Data da verificação: 29/10/2026 (horário de Brasília).
Estado: **PARTIAL** — banco preparado; aplicação e provedores ainda não homologados.

## Alvo e separação
- Banco exclusivo: `atpcursos-staging-db` (D1 da loja, sem compartilhamento com CronogramaATP ou outros projetos).
- Projeto Cloudflare Pages: `atpcursos-staging`, sem alterações no deploy, DNS ou cron.
- Nenhuma query foi executada contra o D1 de produção para alteração de dados.
- Verificados os vínculos `DB` e `PDFS` tanto em `deployment_configs.production` quanto em `deployment_configs.preview` da aplicação de staging.

## Migração aplicada
- `migrations/0006_admin_pin.sql`, **somente** em staging.
- Confirmado via consulta a `sqlite_master`: `admin_pin_accounts`, `admin_pin_tokens`, `admin_pin_sessions`, `admin_pin_login_limits`.
- Ponto de restauração Cloudflare D1 Time Travel consultado antes da execução; o identificador não foi publicado neste repositório.
- O SQL é aditivo (CREATE TABLE/INDEX IF NOT EXISTS). Não contém DROP ou DELETE.
- Contagens comparadas antes/depois: **products=1, orders=0, customers=0**, sem novos administradores cadastrados.
- O teste local de schema foi reforçado para exigir todas as tabelas das migrações 0001–0006, integridade de FK e idempotência da migração 0006.

## Pendências bloqueantes para homologar login real
1. `PIN_PEPPER`: segredo exclusivo da aplicação, mínimo 32 caracteres de alta entropia, provisionado por fluxo seguro no ambiente de staging. Não exibir nem copiar de outros sistemas.
2. `BUYER_HASH_KEY`: chave para hash do e-mail no login do aluno, própria desta loja.
3. `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `PUBLIC_BASE_URL`: credenciais e remetente corretos da mesma conta Resend existente, com domínio verificado, mas identidade da loja separada.
4. Confirmar Cloudflare Access em staging, MFA e allowlist de contas administrativas, sem depender só do PIN.
5. Executar no preview: primeiro registro do PIN por e-mail, login aluno/ADM, reset, bloqueio de tentativas, logout, expiração e negação de identidades não autorizadas.
6. Revisar migrações e segredos antes de qualquer publicação em produção. **CHECKOUT_ENABLED permanece false**.

## Gate
PASS apenas para **preparação do esquema de staging**. Não há autenticação funcional homologada, entrega real por Resend nem deploy de produção.
