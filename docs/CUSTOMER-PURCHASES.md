# atpconcursos — Biblioteca de compras e titularidade permanente

Estado: implementado em branch isolada, sem merge ou deploy.

## Funcionalidade de compras
- A área `/meus-materiais` lista até 30 pedidos recentes do aluno e suas cortesias.
- Os arquivos já personalizados só podem ser baixados por sessão autenticada e pedidos `paid` ou `delivered`; reembolso, outro comprador, ausência de sessão e arquivo revogado negam acesso.
- A chave `BUYER_HASH_KEY` é exclusiva da aplicação, nunca importada do CronogramaATP.
- PDFs são privados no R2 e retornam com `Cache-Control: private, no-store`.
- Os downloads autenticados não alteram os limites de download dos links enviados por e-mail.

## Titularidade após troca de e-mail — migração 0007
- `customer_order_links` vincula cada pedido a uma identidade permanente `customer_id`. `order_id` é chave primária: um pedido não pode ser reivindicado por outra conta.
- Um trigger nega `UPDATE customer_id` de um pedido já vinculado, mesmo via SQL direto.
- Ao confirmar alteração de e-mail por token válido de uso único, a mesma transação D1 reivindica as compras do **e-mail anterior** antes de mudar o endereço e revogar as sessões antigas.
- A reivindicação só é feita quando a conta está ativa **e já possui PIN verificado/configurado** (`password_digest IS NOT NULL`). Uma conta criada pelo administrador, mas sem ativação, não reivindica compras de terceiros.
- Histórico e download consideram a associação permanente com o cliente; a busca por e-mail atual só é aceita se o pedido ainda não tiver sido associado a ninguém.
- A migração é **aditiva**. Não executa backfill automático de compradores, não toca dados de outros projetos, não altera pedidos pagos e não grava e-mail em texto na nova tabela.

## Verificações
- Teste RED anterior: histórico desaparecia após alteração de e-mail, outra conta com endereço anterior passava a ver os pedidos antigos.
- Teste GREEN: os pedidos continuam visíveis após a mudança; uma conta com e-mail antigo reutilizado não consegue visualizar/baixar; uma conta não ativada não consegue reivindicar silenciosamente; tentativa de atualização direta do dono falha.
- Smoke SQL inclui 0001–0007, chaves estrangeiras, idempotência e integridade da titularidade.
- Testes de URL de download, documento legado, reembolso e segregação de dados anteriores continuam obrigatórios.

## Gate e cuidados
- Aplicar `0007_customer_order_ownership.sql` **em staging antes de liberar o novo código em preview/produção**. Exigir consulta de backup/Time Travel, confirmar nome/ID do banco isolado e validar schema.
- Não ativar o checkout. Revisar fluxo real de e-mail com Resend e autenticação de PIN sem usar contas de terceiros.
- Uma conta que nunca ativou PIN não herda automaticamente compras antigas ao mudar de e-mail: essa transferência exige recuperação verificada com suporte e trilha de auditoria.
- Pedidos históricos vinculados somente por e-mail permanecem desprotegidos contra mudança de e-mail **até o usuário ativado executar a troca com esta versão**. Não executar migração em massa sem comprovar titularidade.
- O projeto continua independente dos outros sistemas ATP; deploy, DNS, produção e credenciais exigem gates separados.
