# Constituição ATPCursos v1.0.0 — 2026-10-11

## Missão e limites
ATPCursos vende e hospeda **somente PDFs digitais** para concursos. Loja simples e rápida; comprador informa nome completo e e-mail, paga pela InfinitePay e recebe link temporário via Resend. Sem vídeos, aulas online, senha obrigatória, área do aluno, assinatura ou importação indiscriminada das bases de outros produtos ATP. Adicionar recursos exige novo spec.

## Princípios inegociáveis
1. **Payment-first, verify-first:** nenhuma entrega, download privado ou evento de venda confirmada sem verificação server-to-server contra API oficial InfinitePay, validando pedido, valor em centavos, transação e status. Webhooks podem se repetir, atrasar, chegar fora de ordem ou ser falsificados.
2. **Privacidade por padrão:** R2 originais e cópias privadas; nome e e-mail usados só para fulfillment, marca d'água e comunicação transacional, sem expor em URLs, logs ou analytics. LGPD, política de privacidade, prazo de retenção e exclusão controlada.
3. **Isolamento:** Cloudflare D1/R2/Worker dedicados ao ATPCursos; não usar base de clientes nem segredo compartilhado por padrão. Reutilizar credenciais existentes somente se mesmas permissões/conta e sem imprimir/commitar segredo; preferir segredos exclusivos e rotação.
4. **Código público sem segredos:** proibição de credenciais, .env, arquivos de produção, PII, PDFs pagos e links assinados em Git. CI de secret scan e dependências confiáveis.
5. **PDF fiel e acessível:** preservar integralmente conteúdo, aparência, ordem, acentos e links úteis do original; aplicar marca d'água legível e discreta em TODAS as páginas, incluindo nome e e-mail. Testes visuais com amostras e verificação de texto extraído.
6. **Admin protegido:** upload, publicação e alteração de preços exigem acesso autorizado, log de auditoria, validação de tipo/assinatura PDF, tamanho, direitos de uso e antivírus/quarentena adequada.
7. **Simplicidade e performance:** UI leve, mobile-first, conteúdo explícito, sem dark patterns, sem alegações não comprovadas e sem preços inventados. Acessibilidade WCAG 2.2 AA como meta de QA.
8. **Gate independente:** testes automatizados e auditoria humana nas partes N3/N4 (dinheiro, deploy, DNS, segredos). Publicação só com evidências; PASS/PARTIAL/BLOCKED/FAIL.
9. **Reutilizar antes de instalar:** discovery → licença e origem → version pin/hash → escopos/OWASP → canary → QA → aprovar; não executar comandos remotos não auditados.
10. **Agentes parcimoniosos:** Maestro, engenharia storefront, pagamentos/entrega, segurança e QA; subagentes sob demanda, sem repetir credenciais ou contexto PII.

## Governança
Usar Spec Kit (specify → plan → tasks → implement → converge), teste antes do código (Superpowers quando validado), checklist OWASP, Context7 para docs atualizadas, revisão independente. Memória de projeto `docs/PROJECT_MEMORY.md`. Automação não pode autopromover à produção.

## Alterações de escopo
Precificação, domínio, e-mail remetente e regras de validade são configuráveis e **pendentes de confirmação**; não inventar valores. O dono aprova produtos e cobranças em produção.
