# atpconcursos — PRD (requisitos do produto)
Versão: 2.0 | 29/10/2026 | Estado: plano de implementação; não é prova de funcionalidade.

## 1. Objetivo e isolamento
Concluir a loja digital de PDFs para concursos que já existe no repositório cronogramaatp-code/Atpcursos. A marca comercial passa a ser **atpconcursos** e o domínio proposto é **atpconcursos.cronogramaatp.com.br**. O produto é **independente** de CronogramaATP, Academia ATP, Banco de Questões, Mentoria e demais projetos: não utilizar banco de clientes, vendas, tabelas, buckets, sessões, contas internas ou log de outros projetos. O compartilhamento permitido é estritamente no nível dos fornecedores Resend e InfinitePay, mediante credenciais/regras isoladas por aplicação.

Não reescrever a loja nem trocar Cloudflare Pages, TypeScript, D1, R2, pdf-lib, Resend ou InfinitePay. Reutilizar módulos existentes com correções mínimas.

## 2. Linha de base confirmada
- GitHub: cronogramaatp-code/Atpcursos (repositório público, main). Deploy de produção Cloudflare Pages: atpcursos-producao, commit 8a301d0e2ffb1b022634a7b70977709d89d33884.
- Site atual: atpcursos.cronogramaatp.com.br; novo subdomínio ainda não configurado. Ambiente staging já separado.
- Produção: cinco produtos em draft; Mauá e Itanhaém possuem oito PDFs vinculados cada; Paulínia, Guarulhos e São Gonçalo sem PDFs; nenhum produto publicado ou pedido registrado. O campo page_count dos combos consta zerado.
- Checkout em produção: CHECKOUT_ENABLED=false. Resend: domínio de envio atpcursos.cronogramaatp.com.br verificado na mesma conta. CronogramaATP possui segredo Resend; a existência de segredo InfinitePay utilizável por esta loja NÃO foi confirmada.
- Bloqueio adicional observado: src/checkout.ts (quote) exige products.original_key; os combos com arquivos vinculados podem não ter esse campo preenchido. Corrigir antes de habilitar cobrança.
- Estado: **PARTIAL**, não pronto para aceitar pagamentos.

## 3. Públicos e jornadas
**Visitante:** abre catálogo, encontra concurso/categoria, vê arquivos e preço reais, consulta detalhes, escolhe materiais e inicia checkout sem cadastro prévio obrigatório.
**Comprador:** fornece nome e e-mail, paga pela InfinitePay, recebe confirmação apenas após verificação servidor a servidor, recebe os PDFs personalizados via Resend, ativa conta por link de e-mail, entra em biblioteca e consulta compras.
**Aluno:** entra com e-mail + PIN numérico pessoal de exatamente oito caracteres (aceitar zeros à esquerda); visualiza compras e cortesias, estado de entrega e downloads autorizados; pode solicitar redefinição segura.
**ADM:** primeiro passa pelo Cloudflare Access com identidade autorizada e autenticação forte; depois utiliza PIN numérico individual de oito dígitos como confirmação adicional. Gestão de produtos, arquivos, pedidos, clientes, cortesia, relatórios, falhas, reenvios e auditoria.

## 4. Requisitos funcionais
RF01 — Marca comercial atpconcursos em títulos, metatags, menus, área do aluno, checkout, e-mails, Open Graph e PWA. Não alterar a geometria do símbolo ATP.
RF02 — Paleta permanente: #153F59, #245F7A, #DFEBF2, #F17950, #FFFFFF, #F5F6F2, #1B252D, #717A80, #E2E6E8, #EDF1F3.
RF03 — Domínio novo em Pages sob zona existente cronogramaatp.com.br. Preservar URL antiga por transição segura com redirects planejados, sem quebrar links de compra/confirmar.
RF04 — Login aluno: PIN regex ^[0-9]{8}$ como string; hash adaptativo com salt, proteção contra força bruta, sessão segura, recuperação por e-mail verificado.
RF05 — Login ADM: Cloudflare Access + PIN individual; nenhuma rota API/admin aceita somente PIN nem somente estado de interface.
RF06 — Produtos e combos: listagem/pesquisa, categorias, preço correto, arquivo(s) existente(s), contagem de páginas real/verificada, descrição, amostras autorizadas e estados de disponibilidade.
RF07 — Administração permite criar/editar, adicionar/remover/reordenar vários PDFs, revisar metadados, conferir licenças e publicar somente após Quality Gate.
RF08 — InfinitePay: valor e transação verificados server-to-server; a origem do webhook nunca determina pagamento isoladamente; duplicidade/replay/idempotência tratados.
RF09 — Resend: remetente com domínio validado, mensagens para comprador e ações de conta, logs/erros, reenvio controlado e nenhum segredo exposto.
RF10 — PDFs personalizados em R2 privado, todos os arquivos do combo corretos, links limitados, acesso revogável e recuperação de falhas.
RF11 — Área do aluno contém compras e cortesias efetivas, não apenas cortesias; autorização por identidade verificada.
RF12 — ADM mostra métricas reais, pedidos, status, falhas, cortesias e trilha de auditoria.
RF13 — Termos, política de privacidade, suporte e reembolso com dados reais validados pelo responsável.
RF14 — SEO, acessibilidade, responsividade, performance e rastreamento de funil sem expor PII.
RF15 — CI, testes unitários/de integração/E2E e rollback; nenhuma cobrança ativada sem evidência de homologação.

## 5. Segurança e regras de pagamento
PIN de oito dígitos não equivale a autenticação forte isolada; ADM deve manter Access com MFA preferencial. Não aceitar PIN trivial conhecido, enumerar contas publicamente nem trafegar hashes ou segredos ao navegador. Cada sistema possui o próprio webhook, namespace de pedidos, URL pública e logs, mesmo quando usa a mesma conta InfinitePay. Confirmar o contrato InfinitePay e políticas de reembolso com documentação oficial. Não efetuar compra real em homologação sem aprovação específica.

## 6. Não objetivos
Não hospedar as videoaulas de outros produtos; não integrar banco de questões/mentoria; não migrar para React, Next ou novos provedores; não alterar projetos CronogramaATP; não criar produtos, provas, gabaritos, preços ou depoimentos fictícios; não republicar a logo modificando o símbolo.

## 7. Aceite geral
A prova operacional é uma jornada ponta a ponta no staging: catálogo publicado, transação simulada comprovada, pagamento real controlado quando autorizado, webhook validado, todos os PDFs individualizados, e-mail real enviado/recebido, login do aluno por oito dígitos, compras visíveis, tentativas negativas e cancelamento/reembolso corretos. Verificação independente de segurança/UX/CI. Só depois aprovar deploy e CHECKOUT_ENABLED=true.
