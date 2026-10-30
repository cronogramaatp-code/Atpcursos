# atpconcursos — MEMORY (estado e decisões verificáveis)
Atualizado em 29/10/2026. Este arquivo registra decisões e fatos, não simula memória automática de agentes.

## 1. Fonte de verdade e prioridade
1. PRD.md — escopo e requisitos comerciais.
2. ARCHITECTURE.md — contratos e limites técnicos.
3. RULES.md — restrições permanentes, segurança e identidade.
4. DESIGN.md — paleta oficial, logo e interface.
5. TASKS.md — sequência e critérios objetivos.
6. MEMORY.md — estado factual, mudanças e bloqueios.
Documentos antigos docs/PROJECT_MEMORY.md, docs/BRANDING.md e docs/RELEASE-GATE.md contêm histórico e podem contradizer o novo requisito; não apagá-los nem assumir que representam deploy atual. Após implementação aprovada, atualizar docs compatíveis e evitar versões divergentes.

## 2. Decisões do usuário
- Novo nome comercial **atpconcursos**.
- Domínio sob cronogramaatp.com.br, proposta **atpconcursos.cronogramaatp.com.br**.
- Independência completa em relação a CronogramaATP, Banco de Questões, Academia e outros projetos.
- Continuar aproveitando infraestrutura existente e reutilizar a conta Resend e InfinitePay do ecossistema, mas NÃO compartilhar usuários, transações ou webhooks.
- Aluno e ADM devem ter senha individual **numérica de exatamente oito dígitos**. ADMIN continua exigindo Cloudflare Access por segurança.
- Paleta oficial PERMANENTE: #153F59, #245F7A, #DFEBF2, #F17950, #FFFFFF, #F5F6F2, #1B252D, #717A80, #E2E6E8, #EDF1F3.
- Logo original fornecida preservada: triângulo estilizado e seta central integrada; alterar cores/acabamento, não inventar novo símbolo.

## 3. Evidências técnicas observadas
- Repo cronogramaatp-code/Atpcursos, público, main 8a301d0e2ffb1b022634a7b70977709d89d33884. Código contém TypeScript, Cloudflare Pages Worker e módulos de checkout, PDF, alunos, admin, páginas e SEO.
- Cloudflare Pages produção atpcursos-producao; domínio atpcursos.cronogramaatp.com.br ativo. atpconcursos.cronogramaatp.com.br não tinha registro DNS quando consultado.
- Produção: cinco produtos em draft, 16 arquivos PDF vinculados (8 Mauá, 8 Itanhaém, 0 nos outros três). page_count desses produtos/arquivos estava zero; orders zerado nas consultas.
- CHECKOUT_ENABLED=false em produção. Ambiente staging separado com banco e bucket privados.
- Resend conectado: domínio atpcursos.cronogramaatp.com.br verificado e sending habilitado. Worker principal cronograma-atp mostra bindings RESEND_API_KEY e RESEND_FROM_EMAIL; isso NÃO implica que a mesma chave esteja no Pages da loja.
- Worker cronograma-atp não exibiu segredo InfinitePay entre os bindings inspecionados. A conta comercial e as credenciais reais ainda precisam ser validadas com o responsável; não foram copiadas.
- src/domain/customer.ts usa validPassword 12..128; alteração do PIN para 8 números NÃO foi implementada.
- src/checkout.ts quote() verifica campo products.original_key, mas combos 8 PDFs possuem essa coluna nula na consulta de catálogo; corrigir antes da primeira compra.
- .github/workflows/qa.yml executa em PR e push da branch antiga feat/spec-kit-loja-pdfs, mas não push em main.
- O repositório ainda se chama Atpcursos e possui tokens visuais antigos; não afirmar rebranding concluído.

## 4. Ferramentas e limites
- GitHub e Cloudflare: leitura confirmada e permissões para documentação em branch isolada. Nenhum deploy ou DNS alterado por esta documentação.
- Graphify: nenhuma workspace acessível; mapa conceitual do repositório vem de caminhos GitHub.
- Context7: consultado para Cloudflare Workers/D1 e pdf-lib em sessões anteriores; confirmar versões e documentação ao implementar APIs.
- Resend: domínio confirmado; não houve envio de e-mail real nesta etapa.
- GitHub Actions PR #8 executou em 29/10/2026: job Loja / pagamentos / marca d'agua PASS (npm ci, build, build Pages, npm test, schema smoke, audit); job MCP owner / autorizacao FAIL somente na etapa de vulnerabilidades de produção.
- Diagnóstico CI específico: npm audit --omit=dev --audit-level=high encontrou **8 vulnerabilidades: 4 moderadas e 4 altas** em dependências do MCP (@modelcontextprotocol/client, @modelcontextprotocol/sdk, @modelcontextprotocol/server e transitivas body-parser, fast-uri, ip-address, qs). O erro é reproduzido no build do PR com alterações apenas em docs; não foi introduzido pelos documentos. A revisão de versões e correção mínima devem ser executadas com testes antes de merge.
- Testes E2E e pagamento real NÃO foram executados nesta etapa; estado segue PARTIAL e bloqueio CI de segurança.

## 5. Gate e autorização
PRODUCTION GATE = BLOCKED: sem checkout real, teste end-to-end e credenciais isoladas.
N4 a autorizar separadamente: alteração DNS e Access; segredos; deploy; transação real; ativação de checkout; migração de dados em produção.
Planejamento entregue em branch de documentação e PR draft não equivale a aprovação do código e nem publicação.

## 6. Evolução (registro inicial)
- 29/10/2026 — nome, paleta, independência e requisito de PIN incorporados ao planejamento. Reaproveitamento do stack em vez de reconstrução.
- Nova decisão de segurança: o PIN de 8 números do ADM é complemento e não substituto do Cloudflare Access; usar identidade e autenticação forte existentes.
- Correção essencial identificada: checkout de multi-PDF depende de campo legado original_key, incompatível com itens novos.
- Próximo passo técnico após aprovação do plano: ATP-00 (baseline e testes), em branch isolada. Sem pular para produção.
