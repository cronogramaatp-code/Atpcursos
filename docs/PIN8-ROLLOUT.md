# atpconcursos — implantação controlada do PIN numérico de 8 dígitos

Estado: implementação do aluno somente em branch de revisão; não liberada em produção.

## Contrato
- Login do aluno: e-mail + PIN individual **exatamente 8 caracteres de 0 a 9**, inclusive zeros à esquerda; nunca converter para Number.
- A senha anterior de 12+ caracteres deixa de ser aceita. É necessário solicitar uma redefinição **mediante token de e-mail confirmado** para cada conta antiga; não migrar/convertê-la automaticamente.
- Os PINs são protegidos por HMAC-SHA-256 com uma chave **PIN_PEPPER** exclusiva da aplicação, fora do D1 e fora do Git, antes do PBKDF2-SHA-256 com sal aleatório e 310.000 iterações.
- **PIN_PEPPER**: segredo com pelo menos 32 caracteres de alta entropia; não utilizar chave padrão ou reutilizada de outro projeto. Configurar com o mecanismo autorizado da Cloudflare Pages para cada ambiente. A aplicação falha fechada (503) quando ausente.
- Limite online por identidade: cinco tentativas por 15 minutos (regra já existente em D1). Validar ainda WAF/rate limit por IP, anti-spraying e logs sem dados pessoais antes do lançamento.
- Todas as sessões do aluno são revogadas após redefinição. A confirmação por e-mail deve ser testada em staging com o Resend já verificado.
- O ADM continua protegido por Cloudflare Access. A implementação de PIN de oito dígitos do ADM é uma tarefa separada, com gate de autorização independente; **não** remover Access.

## Gates antes de produção
1. CI principal e testes PIN/recuperação PASS.
2. Domínio e envio Resend da loja validados; PIN_PEPPER exclusivamente configurado via segredo Cloudflare.
3. Testes do e-mail de recuperação e política de rotação de segredo, sem divulgar segredos.
4. Testes de login, tentativas, expiração, reset de senha, sessões, bypass e dispositivos móveis.
5. Gate administrativo, operacional e LGPD aprovado. Nenhum deploy nem migração automática realizados por esta branch.

## PIN administrativo — segunda etapa de autenticação
- Continuar exigindo Cloudflare Access validado (JWT issuer/audience/allowlist) em **toda** rota `/adm*` e `/api/admin/*`.
- Requer aplicar somente no D1 desta loja a migração `migrations/0006_admin_pin.sql` após backup e verificação de staging; nenhuma tabela/conta de outros projetos.
- O primeiro cadastro e a redefinição do PIN administrativo exigem um link de 15 minutos enviado por Resend ao e-mail já autorizado pelo Access; token de uso único, nunca fornecido em logs.
- A sessão de PIN é `__Host-atp_admin_pin`, HttpOnly, Secure, SameSite=Strict, 30 minutos, e vinculada ao hash da identidade Access. Sem Access, o PIN não autoriza nada.
- O acesso ao ADM é barrado pelo servidor sem PIN, inclusive APIs, não apenas por ocultação da tela. Limitar a 5 tentativas de PIN por identidade em 15 minutos.
- O PIN de administração usa o mesmo segredo **PIN_PEPPER da aplicação atpconcursos**, e nunca uma chave de outra aplicação. A loja só será habilitada após configurar o segredo em staging e depois por fluxo autorizado em produção.
- Verificar URL de envio `PUBLIC_BASE_URL` e remetente Resend; a plataforma permanece independente do CronogramaATP, mesmo quando utiliza a mesma conta comercial do provedor.
- Testar funcionalmente a migração, o envio do link de ativação, o Access com MFA, o bloqueio de APIs, expiração, logout e recuperação antes de deploy.
- A página de confirmação do PIN não carrega JavaScript do dashboard enquanto a sessão não está verificada.