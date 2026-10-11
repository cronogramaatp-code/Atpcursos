# Memória operacional — ATPCursos

Atualizado: 2026-10-11

## Objetivo permanente
Loja e hospedagem exclusiva para PDFs educativos para concursos: simulados, mapas mentais, resumões, apostilas, cronogramas, questões e combos. Cliente digita **nome completo e e-mail** para personalização; checkout InfinitePay; email Resend com link temporário a cópia individualizada. Sem senha, vídeos, aulas ou cursos hospedados.

## Referências confirmadas
- Repositório alvo: `cronogramaatp-code/Atpcursos`; originariamente vazio, público, main inicializada com README e branch de feature `feat/spec-kit-loja-pdfs`.
- Repositório ATP preexistente `cronogramaatp-code/cronogramaatp` é **privado**, com referência a `RESEND_API_KEY` e `INFINITEPAY_API_KEY` em `wrangler.toml` (nomes comentados, valores não auditados); jamais presumir chave existente/válida.
- Conta Cloudflare acessível; há bancos, buckets e projetos de **outros** serviços ATP, mas nenhum recurso exclusivo atpcursos identificado na consulta inicial. Não reutilizar recursos de produção alheios.
- VAIO Windows 11 identificado; módulos de agent skills, codebase memory, codegraph e Paperclip presentes, mas nem todos os SKILL.md puderam ser lidos devido a permissão; não declarar agentes/skills executados.
- Context7 consultado para pdf-lib; documentação oficial InfinitePay brasileira consultada; YouTube consultado como referência de fluxo, porém contrato de pagamento depende de documentação oficial.

## Identidade
Usar emblema ATP metálico e mascotes enviados pelo dono: GCM boné em pé, versão circular, polícia cabelos longos corpo inteiro e busto. Paleta navy #0F2D52, blue #1E5AA8, white #FFFFFF, gold #C8A24D, light #F4F6FA. Arquivos de imagem ainda não incluídos no repo.

## Estado do projeto
- Fase: specify/plan.
- Testes: nenhum teste de pagamento real ou geração em produção executado.
- Quality Gate: **PARTIAL**. Site não publicado.
- Atalhos a evitar: usar InfinityPay de outros países por engano; confiar em webhook puro; pôr PDF pago no bucket público; imprimir segredos; cobrar sem teste.

## Pendências de decisão
Preço por material, domínio, nome/e-mail do remetente, InfiniteTag adequada, política de 2ª via e expiração, restrições de distribuição dos PDFs e dados jurídicos. Não inventar.

## Próximo turno
1. Confirmar a branch e arquivos; identificar ferramentas locais verificadas.
2. Aprovar visual sobre assets finais, sem inventar nova logo.
3. TDD local com mocks e artefatos de homologação; configurar staging dedicado.
4. Só depois testar checkout real e deploy.


## Continuação de 2026-10-11 — Cortesia, e-mail e senha
Pedido: adicionar ao admin concessão de cortesia gratuita de PDFs, gestão e alteração de e-mail dos alunos e troca/redefinição de senha de acesso. Mantida compra pública sem senha; contas são opcionais e podem surgir automaticamente após pagamento validado.
Implementado na branch `feat/spec-kit-loja-pdfs`: migrations `0002_courtesies_accounts.sql`, `0003_login_throttle.sql`, módulos `customer-admin.ts`, `customer-public.ts`, `admin-customers-ui.ts`, `domain/customer.ts`, testes de validação, senha e tokens, rotas integradas com app de checkout existente. Admin: `/adm/alunos`; comprador: `/meus-materiais`; confirmação `/confirmar`.
Cortesia não gera ordem de pagamento nem entra na receita. Expiração opcional. Reset via e-mail (1 hora), token hash e senha derivada PBKDF2; troca de e-mail validada no novo endereço. Sessões invalidadas após mudanças.
Ainda pendente: migrar D1 de staging dedicado, configurar Cloudflare Access, Resend e R2, testes com PDFs reais, mensagens de recuperação, E2E, ambiente protegido e publicação. **Não afirmar disponibilização real em produção.**

## Estado consolidado — QA e staging em 11/10/2026
Esta seção **substitui estados antigos** de planejamento, logo ausente e infraestrutura inexistente acima.
- Branch em andamento: `feat/spec-kit-loja-pdfs`, PR #1 aberto em modo draft. Checkout real bloqueado em ambiente não produção.
- Identidade oficial metálica ATP publicada em `public/brand/`: favicon, PWA, imagem social, Apple Touch e cabeçalhos. Mascotes para materiais futuros.
- Cloudflare possui recursos **dedicados** `atpcursos-staging-db` (D1) e `atpcursos-staging-pdfs` (R2 privado), sem Worker ATPCursos implantado e sem domínio oficial definido.
- D1 staging remoto: a tabela `customer_login_limits` de `0003_login_throttle.sql` foi criada com `IF NOT EXISTS` após revisão e confirmada com consulta. Não foi aplicado SQL destrutivo. Verificar rastreamento D1 de migrations antes de novos deploys.
- Correções publicadas em `0cb0620`: checkout da InfinitePay aceita `checkout.infinitepay.com.br` (e rejeita hostnames falsos); confirmador exige `paid=true` e `amount` idêntico ao pedido; PDF usa Noto Sans Unicode sob SIL OFL e preserva nome/e-mail; PWA usa atualização rede-primeiro para arquivos públicos.
- Evidências: 21 testes loja, 4 MCP, migrações 0001–0003 local, 13 verificações HTTP locais com encerramento do Worker, pacote Wrangler `--dry-run`, auditoria de dependências de produção sem vulnerabilidades de nível alto/crítico, CI no GitHub PASS no commit de código.
- Projeto local em `C:\Users\VAIO-FE16\Desktop\ATPCursos-dev` e clone `ATPCursos-git`; manter ambos sincronizados com GitHub. Artefatos temporários/backup fora do Git.
- Quality Gate **PARTIAL**: inexistem testes comprovados de transações reais ou e-mail real; falta URL staging, credenciais/Cloudflare Access, OAuth MCP para outra conta ChatGPT, produtos licenciados e aprovação da release. Nunca declarar plataforma concluída ou vendas habilitadas antes desses testes.
