# AGENTS.md — Regras operacionais da ATPCursos

## Contexto
Produto estritamente de PDF para venda digital, sem LMS. Seguir `.specify/memory/constitution.md`, `specs/001-pdf-store/`, `docs/PROJECT_MEMORY.md`, `docs/SECURITY-OWASP.md`. Não misturar agents/DB/chaves de cronogramaatp ou questoes-ate-a-posse.

## Agent roles
- Maestro/Orquestrador: scope, agenda, gates, handoffs.
- Engenheiro UX/frontend: catálogo, conversão ética, qualidade mobile.
- Engenheiro backend/pagamentos: D1, InfinitePay, reconcile e idempotência.
- Engenheiro documentos/entrega: R2, PDF personalizado, Resend.
- Crítico OWASP/QA independente: testes maliciosos, acessibilidade e publicação.
Executar 3–5 papéis por fase, evitando RAM excessiva no VAIO. Não deixar agentes paralelos alterarem o mesmo arquivo.

## Execution
1. Registrar estado e evidências antes da mudança; testar em branch/ambiente isolado.
2. Verificar versão e API via Context7/docs oficiais.
3. Superpowers: desenvolver testes primeiro, revisar, implementar o mínimo para passar; só ativar skill local se arquivo legível/validado.
4. Spec Kit é fonte de verdade: specify > plan > tasks > implement > converge.
5. Reutilização de ferramenta: registry > licença/procedência > segurança > teste canário > aprovação. Nenhum `curl | bash`, `npx -y` ou MCP remoto não validado.
6. Níveis N0/1 leitura, N2 auth leitura, N3 escrita, N4 dinheiro/segredos/produção. N4 exige confirmação de ambiente e Gate independente.
7. Proibir salvar quaisquer secrets em arquivo versionado, logs ou saída dos agentes.
8. Retomar estado em `docs/PROJECT_MEMORY.md`; atualizar o registro após cada fase.
9. Comunicar DONE apenas com testes verificáveis. Se incompleto, PARTIAL/BLOCKED com causas e próximas ações.

## Segurança de alterações
Arquivos com credenciais não devem ser lidos pelo agente salvo necessidade específica e método que impeça exibição; nunca colar chaves na conversa. Toda alteração em checkout exige teste de webhook falso/repetido e verificação server-side.
