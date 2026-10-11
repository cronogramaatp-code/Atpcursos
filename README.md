# ATPCursos

Loja digital de **PDFs para concursos públicos**, independente dos demais sistemas ATP.

> Estado: **planejamento e implementação inicial**. **Nenhuma cobrança real nem publicação em produção está autorizada sem Quality Gate de homologação.**

## Escopo
- Catálogo de simulados, mapas mentais, resumões, apostilas, cronogramas, cadernos de questões e combos; cada produto é entregue somente em PDF.
- Loja responsiva, páginas individuais por produto, amostra pública com marca de demonstração, checkout InfinitePay.
- Comprador informa somente **nome completo e e-mail**, sem senha ou conta obrigatória, para entrega e marca d'água.
- Após pagamento **verificado servidor a servidor**, gerar PDF individualizado com nome e e-mail em todas as páginas e disponibilizar um link privado temporário enviado pelo Resend.
- Admin autenticado para subir versões do PDF, publicar materiais, fixar preços, acompanhar pedidos, reprocessar falhas e reenviar links.
- Banco D1 + R2 privado + Workers/Pages Cloudflare, isolados dos demais projetos. Segredos exclusivamente via Cloudflare Secrets.

## Restrições obrigatórias
Não copiar chaves, dados de compradores nem recursos de produção de outros projetos. Não autorizar download ou atualizar status baseado apenas no redirecionamento do navegador ou em webhook não verificado. Não publicar materiais protegidos por direitos autorais de terceiros sem autorização. LGPD, minimização e retenção documentadas.

## Identidade
Nome: **ATPCursos**. Azul noturno `#0F2D52`, azul `#1E5AA8`, branco `#FFFFFF`, dourado `#C8A24D`, fundo gelo `#F4F6FA`. Emblema ATP e mascotes fornecidas pelo proprietário; preservar arquivos originais e seus direitos.

## Plano de trabalho
Ver `.specify/memory/constitution.md`, `specs/001-pdf-store/`, `AGENTS.md` e `docs/` na branch de desenvolvimento.
