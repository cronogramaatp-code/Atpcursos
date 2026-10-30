# atpconcursos — Biblioteca de compras autenticada

Status: implementação em branch isolada, ainda sem validação de envio real ou deploy.

## Funcionalidade
- `GET /api/customer/me`: mostra cortesias existentes **e** até 30 pedidos mais recentes associados ao e-mail verificado do cliente; os dados incluem estado de pagamento, total e lista de PDFs com estado de disponibilização.
- `GET /api/customer/purchases/bundle/{delivery_id}/download` e `.../legacy/{delivery_id}/download`: download apenas de PDF **já personalizado** e armazenado no R2 privado, associado a pedido `paid` ou `delivered` pertencente ao comprador autenticado.
- A propriedade `downloadable` somente é verdadeira para arquivos realmente disponíveis; pedido `refunded`, arquivo `revoked` ou entrega pendente não permitem download.
- Os arquivos nunca são expostos por URL direta do R2 e o retorno usa `Cache-Control: private, no-store`.
- A UI separa **Minhas compras** e **Cortesias**, sem confundir cortesias com receita.
- A biblioteca não substitui nem altera os links de e-mail existentes. O limite de 5 usos/72 horas continua vigente para os **links enviados por e-mail**. Os downloads autenticados usam a sessão do aluno e autorização servidor a servidor.
- O acesso falha fechado quando `BUYER_HASH_KEY` não estiver configurada.

## QA executado
- Identidade do comprador conferida pelo HMAC do e-mail da sessão, com chave exclusiva da loja.
- Acesso negado para PDF de outro comprador e pedido reembolsado.
- Cobertura de PDFs individuais legados e de bundles multi-PDF.
- Testes da API real do Worker, além de testes de serviços.
- Testes do PWA confirmam que as rotas privadas `/api/customer/...` não entram no cache.

## Limitação e próximo gate
O vínculo atual é feito pelo hash do e-mail no momento da compra. Se o comprador alterar o endereço posteriormente, os pedidos anteriores **não serão recuperados automaticamente pelo novo e-mail**. Antes de considerar a plataforma 100% concluída, adicionar associação permanente de pedidos à identidade do cliente, com migração versionada e validação de recuperação sem criar acesso cruzado entre contas. Nenhum backfill automático de histórico foi realizado.
A homologação real exige secret independente, Resend funcionando e conta validada, sem usar dados de outro projeto.
