# atpconcursos — RULES (regras permanentes para implementação)
Versão 2.0 | 29/10/2026 | Aplicar em qualquer branch/tarefa atpconcursos.

## 1. Identidade e fronteira
- Nome comercial oficial: **atpconcursos**. O repositório existente pode manter o nome Atpcursos até decisão separada de renomeação técnica.
- Identidade cromática oficial e permanente, sem valores alternativos não aprovados: #153F59, #245F7A, #DFEBF2, #F17950, #FFFFFF, #F5F6F2, #1B252D, #717A80, #E2E6E8, #EDF1F3.
- A logo enviada é fonte primária. Preservar exatamente triângulo estilizado e seta central integrada. Aperfeiçoar acabamento/cor sem substituir por A genérico, triângulo vazio, escudo, colunas, símbolos de polícia ou brilho decorativo.
- Não compartilhar, mesclar ou migrar clientes, pedidos, relatórios, D1, R2, autenticação, credenciais ou dados pessoais de outros projetos ATP. Compartilhamento permitido: conta de fornecedores Resend e InfinitePay, com aplicações, segredos e webhooks próprios.
- Tratar outros projetos como N4: proibido modificar Worker, DNS, banco, repos ou deployment deles por consequência indireta.

## 2. Auth
- Aluno e ADM usam PIN individual de **exatamente oito dígitos decimais** na interface; PIN é sempre string, aceita zeros à esquerda e não aparece em URL/log.
- PIN de oito números não é segundo fator genuíno nem segredo suficiente isolado para ADM. Cloudflare Access com identidade autorizada e MFA preferencial permanece obrigatório; API exige validação no servidor.
- Nenhum PIN universal, padrão, incluído em GitHub, dado em texto puro ao administrador ou armazenado reversivelmente.
- Hash/KDF com salt individual; rate limit, detecção de abuso, recuperação segura por e-mail/identidade e revogação de sessões obrigatórios; testes com 8, 7, 9 números, símbolos, erro repetido e bypass.

## 3. Comércio e dados
- CHECKOUT_ENABLED permanece false até Quality Gate financeiro PASS e aprovação explícita da ativação.
- Somente confirmação InfinitePay servidor a servidor pode marcar pagamento validado; webhook sem reconciliação não pode entregar nada.
- Cada pedido referencia produtos e snapshots do R2 desta loja, nunca de outro projeto. Tolerar webhook duplicado sem entrega duplicada.
- Originais pagos ficam exclusivamente no R2 privado; frontend e PWA nunca cacheiam PDFs privados, tokens ou dados pessoais.
- Não criar provas, questões, preços, gabaritos, depoimentos, métricas ou contas fictícias como material publicado.
- Resend deve usar domínio verificado e tratamento de falhas; não presumir que segredo de outro projeto é copiável ou válido.
- Segredos em bindings Cloudflare, criados por fluxo autorizado. Jamais escrever no código, documentos, logs, comentários de PR, e-mail ou conversa.

## 4. Engenharia
- Reutilizar stack TypeScript + Cloudflare Pages/Workers + D1 + R2; verificar ferramentas existentes antes de instalar outra.
- Superpowers: especificação -> testes que falham -> correção mínima -> testes que passam -> revisão -> gate.
- Ponytail: fazer o menor diff seguro. Não simplificar controles de dinheiro, segurança, integridade, privacidade, acessibilidade ou rollback.
- Context7/documentação oficial para APIs atuais, especialmente InfinitePay, Workers, D1 e pdf-lib. YouTube somente como demonstração complementar, não contrato de segurança.
- Não reformatar arquivos não relacionados; evitar refatoração geral e migração de frameworks.
- Executar build, testes, lint/audit e E2E relevantes. A aprovação anterior de CI não prova a versão atual.
- Contexto de outra aplicação/repo não autoriza a sua alteração.

## 5. Interface e acessibilidade
- Preferir branco e superfícies claras, azul-escuro para navegação, coral para CTA e azul médio para apoios.
- Contraste WCAG AA nas combinações efetivamente utilizadas. Coral #F17950 com texto branco falha para texto comum (aprox. 2,77:1); usar #1B252D no coral (aprox. 5,63:1). Cinza #717A80 sobre branco é ~4,38:1, insuficiente para texto comum de 16px; usar azul ou grafite.
- Desktop, tablet e celular (320/375/390/768/1440). Estados foco/teclado/loading/error/empty/sucesso e reduce-motion obrigatórios. Não criar botões que não funcionam.
- Uma oferta e uma ação principal por página de venda; exibir detalhes factuais dos PDFs e como funciona a entrega.
- Preferir melhoria incremental a redesenho arbitrário. Mudanças de marca exigem auditoria da imagem original e prévia aprovada.

## 6. Ambientes e releases
- Git em branch isolada. PR aberto como draft para planejamento; merge não automático.
- Homologação usa D1/R2 próprios e checkout falso/simulado, sem transação real desnecessária.
- N0/1 (discovery/read) pode avançar; N3 (escrita em branch/staging) requer validação de escopo; N4 (DNS, produção, segredo, pagamentos, deploy, exclusão) exige aprovação específica, backup e rollback.
- Em FAIL/PARTIAL, registrar causa raiz e modificar estratégia; nunca repetir tentativa cega nem declarar sucesso.
- Documentação aprovada não prova implementação, deploy ou operação. DONE exige evidência atual do mesmo commit instalado.

## 7. Critério final
Quality Gate PASS somente com 100% dos caminhos críticos testados, todos os P0/P1 corrigidos, verificação de segurança independente, checkout e entrega comprovados, logs sem PII e rollback disponível. Até lá status PARTIAL ou BLOCKED.
