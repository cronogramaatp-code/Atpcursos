# Checklist de aceite SEO — ATPCursos

- [ ] Staging retorna `X-Robots-Tag: noindex, nofollow` em todas as respostas HTML e `Disallow: /` em robots.txt.
- [ ] Producao preserva indexacao apenas de rotas publicas adequadas.
- [ ] `/sitemap.xml` responde XML valido, inclui apenas produtos publicados e URLs canonicas de producao.
- [ ] Slug de produto inexistente retorna HTTP 404 e nao aparece no sitemap.
- [ ] Cada produto publicado tem title, description e canonical proprios, com escaping HTML.
- [ ] Rotas privadas, login, admin, checkout e APIs nao entram no sitemap.
- [ ] OpenSEO executa isoladamente e protegido por autenticacao; nao tem acesso a PDFs privados ou dados pessoais de clientes.
- [ ] DataForSEO permanece desligado ate existir autorizacao de gastos e limite de uso.
- [ ] Testes automatizados e revisao independente aprovados; checkout, webhook e login sem regressao.
- [ ] Publicacao em producao exige revisao do diff e gate de release.
