# OpenSEO — ATPCursos

Status: planejamento em branch, sem deploy.

Origem: https://github.com/every-app/open-seo (licenca MIT).

Arquitetura: OpenSEO isolado do Worker da loja, D1, R2, checkout e dados de compradores. Verificar versao e dependencias antes de instalar. Usar Cloudflare Access e credenciais em secrets; nao compartilhar credenciais entre projetos.

SEO prioritario: bloquear indexacao de staging; sitemap dinamico somente para produtos publicados; responder 404 para produtos inexistentes; title e description unicos; dados estruturados validados; canonicals e robots. Revisar e testar em homologacao antes de promover.

Custos: DataForSEO e servico pago por uso; nao ativar chamadas pagas sem limite aprovado.

Gate: CI, auditoria de seguranca, canario, revisao independente, nenhuma alteracao em pagamentos.
