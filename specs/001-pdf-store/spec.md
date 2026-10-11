# Feature Spec — 001 Loja de PDFs ATPCursos

**Status:** DRAFT — requisitos funcionais definidos; pagamentos reais e deploy BLOCKED por QA.  
**Data:** 2026-10-11  
**Produto:** ATPCursos

## Resumo
Vender PDFs de simulados, mapas mentais, resumões, apostilas, cronogramas, cadernos de questões, legislação e combos. Sem cursos hospedados nem ambiente de aula. O comprador informa nome completo e e-mail, paga por checkout InfinitePay e recebe mensagem Resend com acesso temporário ao PDF com marca d'água em todas as páginas.

## Personas
- Visitante anônimo explorando concurso/banca/disciplina.
- Comprador com apenas nome completo e e-mail, sem conta.
- Administrador ATP autorizado a cadastrar material, preço, preview, combo e publicar, acompanhar vendas, reenvios e reembolsos.
- Auditor autorizado em modo somente leitura.

## Jornadas e critérios verificáveis
### US-01 — Descoberta de produtos (P1)
Página inicial com proposta de valor, busca e filtros por concurso, banca, disciplina, tipo, preço; cards mostram título, capa, descrição honesta, preço configurado, número de páginas (quando conhecido) e link individual. Mobile-first. **Aceite:** produto despublicado não é vendável; filtros funcionam sem login; preço consistente no backend.

### US-02 — Página de vendas individual (P1)
Cada slug apresenta capa, benefícios factuais, sumário, conteúdo/versão e data de atualização, para quem se destina, arquivos incluídos, FAQ, termos e botão Comprar. Preview público separado, claramente marcado AMOSTRA e limitado a páginas autorizadas. **Aceite:** botão nunca traz preço cliente como autoridade.

### US-03 — Checkout mínimo (P1)
Coletar nome completo e e-mail, consentimento/aviso de privacidade necessários, sem cadastro/senha obrigatória; criar pedido pending com snapshot imutável de produto(s), preço em centavos, moeda BRL e versão. Gerar checkout da InfinitePay no servidor com `order_nsu` único. **Aceite:** validação, rate limiting, replay protection, preço calculado pelo servidor.

### US-04 — Verificação independente e idempotência (P0)
Receber webhook, correlacionar `order_nsu`, verificar o pagamento server-to-server via `payment_check` com identificadores originais e comparar `paid`, valor e merchant. Apenas `verified_paid` aciona fulfillment. Eventuais duplicações, tentativas maliciosas e respostas fora de ordem não podem gerar entrega duplicada. **Aceite:** testes para webhook falso, duplicado, atrasado, valor divergente e pedido inexistente.

### US-05 — Personalização PDF e entrega (P0)
Após confirmação, carregar PDF original do R2 privado, aplicar marca d'água com NOME COMPLETO e E-MAIL em todas as páginas, discreta em diagonal e rodapé, preservando conteúdo, acentos, links e paginação. Salvar cópia em R2 privado com chave aleatória sem PII e versão, checksum e trilha da entrega. Enviar pelo Resend **somente link de resgate protegido de curta duração** (sem attachment padrão). **Aceite:** QA compara páginas, sem arquivo público, sem envio antes de pago.

### US-06 — Acesso e reenvio (P1)
Download via token opaco, hash no banco, expiração e contador configuráveis; resposta `Cache-Control: private, no-store`; usuário pode pedir novo e-mail via fluxo com rate limiting e resposta neutra (anti-enumeração). **Aceite:** token expirado/revogado/reutilizado fora de regra falha; não revelar se e-mail existe.

### US-07 — Administração (P1)
Painel restrito com produtos, rascunho/publicação, versões de PDF, uploads e preview, preços, estoque digital infinito por padrão, pedidos, eventos, faturamento conciliação, entregas falhas, reenvio auditado e refunds. **Aceite:** somente administradores autorizados conseguem editar; upload inválido isolado, não publicado.

### US-08 — Conteúdo e proteção de dados (P1)
Páginas de contato, privacidade, termos, política de reembolso e suporte. Direitos autorais verificados pelo admin no upload. **Aceite:** não expor PDFs brutos nem registrar PII em URLs ou logs.

## Modelo básico de dados
`products(id, slug, title, type, description, status, price_cents, currency, tags, preview_key, cover_key, current_version_id, created_at, updated_at)`
`product_versions(id, product_id, original_key, sha256, page_count, version_label, published_at)`
`orders(id, public_ref, buyer_name, buyer_email, status, amount_cents, currency, checkout_url, provider_order_nsu, provider_transaction_nsu, paid_at, created_at)`
`order_items(order_id, product_id, version_id, unit_price_cents, quantity)`
`payment_events(id, provider_event_id, order_id, payload_hash, check_status, received_at)`
`deliveries(id, order_id, version_id, status, watermarked_key, generated_at, last_sent_at)`
`download_tokens(id, delivery_id, token_hash, expires_at, remaining_uses, revoked_at)`
`audit_logs(id, actor, action, target_type, target_id, details_redacted, timestamp)`.
Separar workflow admin em autenticação Cloudflare Access/alternativa equivalente.

## Não escopo
Vídeos, aulas e streaming, LMS, certificados, apostilas físicas, assinaturas, CPF/telefone obrigatório, comunidade, venda automática de questões originais de terceiros, publicações a partir de IA sem revisão.

## Requisitos não funcionais
Acessível, SEO, OpenGraph, sitemap, logs estruturados sem PII, monitoramento de webhooks e filas, backup de D1/R2, DDoS/WAF, CORS estrito, headers de segurança, LGPD e testes navegadores móveis.

## Pontos a confirmar
Domínio oficial; preços; nome/e-mail remetente Resend verificado; regras de expiração/reenvio; tamanho máximo PDFs; razão social e textos jurídicos; InfiniteTag/escopos de checkout; autorização/limitações comerciais de artes.


## Adendo 002 — gestão de alunos, cortesias e acesso opcional (2026-10-11)
### Funcionalidades
- Loja pública e interface administrativa isoladas por Cloudflare Access. A página `/adm/alunos` permite cadastrar, pesquisar, conceder cortesias de qualquer PDF publicado, visualizar cortesias existentes, reenviar e revogar.
- Cortesia é direito gratuito (`courtesy_grants`) independente de pedidos pagos. **Jamais somar em receita, MRR, ticket médio ou compras para desconto de fidelidade.**
- Validade configurável: permanente ou 1–366 dias. Links privados são individuais, 72 horas e até cinco downloads; PDF contém nome e e-mail do destinatário.
- Compras pagas verificadas criam perfil de aluno **sem senha**. Conta com senha é opcional, ativada por link de criação/redefinição enviado ao e-mail.
- Administrador pode **solicitar** alteração de e-mail, mas a troca só ocorre após confirmação pelo novo endereço. Antes da confirmação, não alterar destinatário da conta.
- Admin não conhece nem vê senha: solicita link de redefinição de uma hora; aluno define senha mínima 12 caracteres. Sessões atuais são invalidadas ao trocar senha ou e-mail.
- Alteração do e-mail da conta **não reescreve comprovantes de pedidos históricos**; mudanças de destinatário de compras anteriores necessitam fluxo posterior de auditoria/reentrega.
- Ausência de login obrigatório para compra; compradores continuam recebendo PDFs pagos pelo e-mail informado.

### QA necessário
- [x] Pure functions: tokens únicos e hash, validação de email/nome, validade da cortesia, PBKDF2 e login.
- [ ] Integração D1 + R2 + Resend de cortesia, mudança de email e reset com e-mail real.
- [ ] Teste de identidade Cloudflare Access e autorização por perfis.
- [ ] Verificação antiproliferação de token, rate limit e revogação de sessões.
- [ ] PDF com nome/e-mail em todas as páginas, inclusive nomes com acentos e PDFs grandes.
- [ ] Teste de login após confirmação, hash de senha e recuperação; E2E navegador.
- [ ] Verificação independente de dados financeiros de cortesia não lançados em vendas.

**Status: código preparado em branch; não implantado e não homologado para uso real.**
