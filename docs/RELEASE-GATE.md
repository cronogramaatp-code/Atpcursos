# ATPCursos — Release Gate de homologação

**Atualização:** 11/10/2026
**Ambiente em execução:** nenhum Worker ATPCursos publicado. Conta Cloudflare possui D1 `atpcursos-staging-db` e R2 `atpcursos-staging-pdfs`, dedicados.

## Já implementado e verificado localmente
- Loja pública, páginas individuais, admin separado por Cloudflare Access (lógica de verificação; configuração real pendente).
- Catálogo, upload de PDF em rascunho, descontos progressivos 20/30/40/50 sem acúmulo, upsell e métricas.
- InfinitePay: geração de checkout e validação server-to-server; aceita hostname `checkout.infinitepay.com.br` da documentação brasileira; rejeita URLs falsas.
- PDF: marca d'água original com nome/e-mail usando Noto Sans Unicode (SIL OFL v1.1), em todas as páginas. Fonte disponível como ativo estático, PDF pago mantido exclusivamente em R2 privado.
- Envio Resend e tokens temporários, código presente; integração real ainda não homologada.
- Web/PWA: logo ATP, favicon, ícones, OpenGraph, service worker com rede primeiro para assets e exclusão de rotas privadas do cache.
- Testes unitários, migrações SQLite e Wrangler `--dry-run` realizados localmente; sem tentativa de dinheiro real.

## Itens bloqueadores do go-live
1. **Hospedar staging**: ativar autenticação Wrangler ou realizar deploy dedicado pelo conector Cloudflare com revisão de artefatos e rollback.
2. **Confirmação de pagamento**: testar InfinitePay `payment_check`, replays, duplicatas, valores divergentes, reembolsos e checkout completo com conta comerciante real em ambiente apropriado.
3. **Resend**: configurar remetente, domínio verificado e teste real de entrega/segunda via; sem expor API keys.
4. **Admin**: configurar Cloudflare Access, AUD e allowlist; testar login válido/inválido, CSRF e upload de PDF não confiável.
5. **MCP**: conectar outra conta por OAuth, conferir isolamento e testes autenticados (atualmente apenas fail-closed).
6. **Dados/negócio**: cadastrar material original licenciado, configurar preços, domínio oficial, política de reembolso, termos, privacidade e dados da empresa.
7. **QA ponta a ponta**: navegadores móveis, Pix/cartão, R2 personalizado com marca d'água, e-mail e download expirado/revogado.
8. **Liberação**: PR revisado por pessoa independente; status `PASS`; ativação de produção separada de homologação.

## Normas inegociáveis
- Não marcar pedido como pago por redirect ou payload de webhook sozinho.
- Não publicar originais pagos no bucket público nem registrar PII em log.
- Não reutilizar sem análise credenciais nem dados do cronograma ATP/Cripto.
- Não alterar DNS, segredos ou cobrar em produção como etapa implícita.
- Não confundir o sucesso local de build com site publicado.

## Links de referências verificadas
- InfinitePay oficial: https://www.infinitepay.io/checkout-documentacao
- Cloudflare Assets fetch: https://developers.cloudflare.com/workers/static-assets/binding/
- pdf-lib + @pdf-lib/fontkit: https://github.com/Hopding/pdf-lib
- Fonte Noto Sans: https://github.com/notofonts/noto-fonts
