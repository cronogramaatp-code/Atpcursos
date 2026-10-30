# atpconcursos — Editor de PDFs por produto (ADM)

Estado: implementado em branch isolada; nenhuma operação em produção ou publicação realizada.

## Funcionalidade
- Na rota privada `/adm/produtos`, cada **produto em rascunho** dispõe de um editor para consultar arquivos já vinculados por `GET /api/admin/products/:id/files`.
- O responsável pode anexar um PDF por vez através da rota existente `PUT /api/admin/products/:id/upload?name=...` e remover arquivos por `DELETE /api/admin/products/:id/files/:fileId`.
- A listagem exibe título, número de arquivos e contagem de páginas conhecida. Quando desconhecida, mostra “páginas em revisão”.
- O botão de publicação exige confirmação editorial e não pode ser usado sem pelo menos um arquivo.
- O formulário de criação de produto foi atualizado para informar o limite real **50 MB por PDF**.
- O backend permanece responsável pelos limites de **20 PDFs por produto, 300 MB por produto, 50 MB por arquivo**, verificação da estrutura do PDF, R2 privado, autenticação **Cloudflare Access + PIN** e publicação apenas de rascunhos.
- Não existe criação de PDF artificial nem mudança de preço ou estado de produtos. Remoção de arquivo continua uma operação restrita a rascunhos.

## Garantias e QA
- Suíte TypeScript e Pages, testes de interface estática/parse JavaScript, testes já existentes de upload/listagem/remoção em R2 simulado, migrações 0001–0007 e `npm audit` executados localmente.
- Os testes de interface verificam presença dos endpoints protegidos, métodos e limites de tamanho, mas não substituem um **teste de navegador com Cloudflare Access + PIN + R2 real em staging**.
- Atenção a arquivos grandes: metadados de páginas de PDF acima de 12 MB permanecem em revisão editorial até verificação separada.
- Uma alteração de múltiplos arquivos não deve ser realizada após a publicação de um produto; corrigir o conteúdo mediante novo rascunho/processo editorial.

## Gate antes de release
1. Validar os segredos e autenticação no Pages staging da própria loja.
2. Criar rascunho de teste, importar dois PDFs, excluir um e conferir R2/D1 pelo painel, com o administrador autorizado.
3. Verificar as mensagens de erro para PDF inválido, tamanho acima do limite e produto publicado.
4. Auditar o conteúdo editorial e executar migrações de produção apenas com autorização.
5. Checkout real segue desativado até homologar InfinitePay, Resend e entrega personalizada.
