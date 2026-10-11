# Registro de ferramentas — descoberta e trust gate

**Regra:** menção a ferramenta não equivale a instalação, autenticação ou execução. Aprová-la requer origem, docs, licença, revisão de escopos/segredos, custo e teste canário.

| Ferramenta | Finalidade | Status inicial |
|---|---|---|
| GitHub Spec Kit `github/spec-kit` | specify/plan/tasks/converge | DISCOVERED — docs locais conforme Spec Kit; fluxo formal ainda precisa setup canário |
| Superpowers `obra/superpowers` | TDD/revisão e planejamento | DISCOVERED; diretório `.agents/skills/using-superpowers` presente no VAIO, leitura SKILL.md negada: BLOCKED até corrigir permissão legitimamente |
| OWASP Top 10, API Top 10 e ASVS | Threat model | REFERÊNCIA ATIVA; checklist local criado, auditoria executável pendente |
| Context7 MCP | pdf-lib e APIs/libs atualizadas | VERIFIED — consultas feitas; continuar a consultar para cada API |
| DeepSeek Harness | apoio de agentes no VAIO | DISCOVERED — versões e scopes não confirmados; não usar chave em prompt ou terminal sem cofre |
| MCP Codebase / codebase-memory | busca semântica, contexto técnico | DISCOVERED — pasta local vista, endpoint MCP não verificado |
| Graphify `Graphify-Labs/graphify` ou `blockflix/Graphify` | grafo de código | DISCOVERED — escolher implementação e licença; não confundir hosted OAuth com local |
| Ponytail `DietrichGebert/ponytail` | instruções de revisão de engenharia | DISCOVERED — validar código/fonte/versão antes de instalar |
| Vercel `find-skills` e AI Hero | skills discovery | DISCOVERED; diretório find-skills presente, leitura bloqueada |
| `pdf-lib` | watermark | DOCS VERIFIED via Context7; runtime pendente |
| Resend | e-mail transacional | SPECIFIED — credencial/domínio/teste pendentes |
| InfinitePay Brasil | checkout e payment_check | OFFICIAL DOC VERIFIED; ambiente/testes pendentes |
| Cloudflare Workers/D1/R2 | infraestrutura | READ-ONLY VERIFIED; recursos ATPCursos dedicados ainda não criados |

## Regras supply chain
1. Registrar repo/URL exata, commit/tag pinado, hash/assinatura, licença e escopos.
2. Verificar conflitos e hooks/execução automática antes de instalar.
3. Canário no VAIO sem dados reais nem segredos, com RAM/CPU controladas.
4. Só depois marcar APPROVED/ACTIVE. Se versão mudar inesperadamente: QUARANTINE.
5. Não usar `npx -y` indiscriminadamente; preferir revisão e versão travada.
6. Não compartilhar conteúdo do repositório privado com SaaS externo sem confirmação de termos, retenção e autorização.

## Fontes verificadas
- https://github.github.com/spec-kit/
- https://github.com/obra/superpowers
- https://owasp.org/www-project-top-ten/
- https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- https://www.infinitepay.io/checkout-documentacao
- https://developers.cloudflare.com/r2/get-started/workers-api/
- https://github.com/Graphify-Labs/graphify-mcp
- https://github.com/DietrichGebert/ponytail
- https://www.youtube.com/watch?v=nxoSxCL5Tdo (referência visual, não contrato API)
