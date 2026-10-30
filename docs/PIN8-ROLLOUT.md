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
