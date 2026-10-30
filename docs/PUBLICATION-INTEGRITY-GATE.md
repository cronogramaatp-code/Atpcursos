# atpconcursos — Integridade da publicação de produtos

**Estado:** código em branch isolada, PR rascunho, sem deploy em produção.
**Validação de staging:** 30/10/2026; D1 `atpcursos-staging-db`.

## Falha reproduzida
O processo antigo verificava a lista de PDFs no R2 e só depois alterava `products.status`. Um PDF removido entre a inspeção e a gravação permitia marcar o produto como publicado sem o conjunto completo de arquivos previamente aprovado (teste RED: HTTP 200 quando se esperava 409).

## Proteções aplicadas
1. `migrations/0008_product_publication_guards.sql`: cinco gatilhos SQL no D1, sem reescrever arquivos ou pedidos:
   - Impede inserir, alterar e excluir arquivos de produtos que não sejam rascunhos;
   - Limita inserções a 20 PDFs e 300 MB por produto; tamanho individual de 50 MB;
   - Bloqueia publicação com zero PDFs ou mais de 20;
   - Proíbe reabrir para edição um produto já publicado/arquivado.
2. `publishProduct` usa condição atômica de contagem no `UPDATE`, exigindo que o número de arquivos ainda corresponda à lista validada no R2. Se o total mudar durante a conferência, retorna **409**, não publica e não grava auditoria de publicação bem-sucedida.
3. A migração não altera os `order_item_files` existentes, preservando snapshots históricos das compras.

## Evidências
- Testes de proteção SQL: bloquear inserção/deleção/edição pós-publicação, produto vazio, excesso de arquivos/tamanho, migração repetida.
- Teste de concorrência: exclusão durante `PDFS.head` anterior ao UPDATE, agora retorna 409.
- Suíte completa: `npm test`, `npm run build`, `npm run build:pages`, `python tests/schema_smoke.py`, `npm audit --omit=dev --audit-level=high`, `git diff --check`.
- **Staging D1**: alvo confirmado por nome e UUID; bookmark Time Travel obtido antes da migração; **cinco gatilhos** confirmados via `sqlite_master`, 1 produto em rascunho e 10 arquivos preservados. **Produção não foi modificada.**
- Confirmação da semântica de migrações e SQL: documentação Cloudflare D1 (https://developers.cloudflare.com/d1/reference/migrations/ e https://developers.cloudflare.com/d1/sql-api/sql-statements/).

## Limitações e próximos gates
- A contagem atômica reduz o risco de publicar um conjunto diferente durante a verificação, mas não equivale a validar uma identidade/hash criptográfica de todos os PDFs. Concorrências extremamente específicas de substituição de arquivo com contagem idêntica exigem versão/hash de conjunto por produto para bloqueio integral.
- Objetos órfãos de R2 podem surgir se a exclusão no armazenamento falhar após a remoção do registro no D1; requer rotina de auditoria e coleta segura, **não** deleção automática sem revisão.
- Novas importações de produtos legados `published` não podem inserir PDF diretamente após a migração; devem passar por rascunho editorial e publicação validada.
- Antes da produção: confirmar migrações 0001–0007 no banco correto, ponto de restauração, revisão independente de dados legados e QA com R2 real. PR deve ser aprovado e merge controlado antes de alterar o ambiente.
- Resend, PIN, InfinitePay, DNS, checkout e outros projetos ATP não foram modificados nesta correção.
