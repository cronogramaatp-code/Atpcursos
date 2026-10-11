# ATPCursos MCP — administração e desenvolvimento remoto

Status: **ESPECIFICADO / EM IMPLEMENTAÇÃO**, NÃO PUBLICADO.

## Objetivo
Um servidor MCP exclusivo do ATPCursos para conectar uma segunda conta ChatGPT sem compartilhar senhas. URL de produção *proposta, não configurada*: `https://mcp.<domínio-atpcursos>/mcp`. Endereço final depende de domínio e DNS reais.

## Decisão de autenticação
Cloudflare **Access Managed OAuth** na frente do servidor MCP e validação do JWT Cloudflare Access **dentro** do Worker (RS256/JWKS, iss, aud, email allowlist). Usar MCP Streamable HTTP stateless via `agents/mcp/server`. O endpoint sem sessão autenticada responde 401/403; não publicar um MCP sem autorização. Outra conta ChatGPT precisa conectar o URL e concluir login OAuth ao menos uma vez. Se Managed OAuth não for compatível com o cliente, fallback a uma implantação de OAuthProvider baseada no exemplo oficial Cloudflare Access for SaaS, após canário e testes de consentimento/PKCE.

## Escopos propostos
- `atpcursos:read`: catálogo, produtos, dashboard, métricas agregadas, estado do sistema.
- `atpcursos:admin`: escrita de catálogo, preço, publicação de PDF validado, pedidos, reenvio controlado, cortesias (com trilha de auditoria).
- `atpcursos:developer`: repositório próprio, código/branch protegida, testes, CI, logs, verificação de staging, deploy e rollback só com Quality Gate.
- `atpcursos:owner`: união dos escopos acima, exclusiva ao titular autorizado em allowlist Access.

Escopos de produção não podem ser concedidos por instruções do modelo. A autorização real é comprovada por Access/OAuth e política de conta; segredos permanecem no runtime. Nenhuma ferramenta permite shell arbitrário, SQL destrutivo ou acesso a outros projetos.

## Ferramentas planejadas
Ver `mcp/tool-registry.json`: catálogo, pedidos, online, relatórios, importação, vendas, descontos, entregas, logs, diagnóstico, Git, CI, preview/deploy/rollback.

## Isolamento
Servidor `atpcursos-mcp` separado do Worker da loja e do admin, com token Access AUD exclusivo. D1/R2 ATPCursos próprios, serviço do MCP sem permissão para os bancos dos outros projetos. OAuth, logs e auditorias em namespaces exclusivos. Negar por padrão; redaction em sucessos E ERROS; rota identificada por IDs aleatórios, sem e-mail em logs.

## Quality Gate de conexão
1. Verificar ID da conta Cloudflare e origem/dominio, criar recursos específicos staging.
2. Criar aplicação Access e AUD correto com allowlist do proprietário.
3. Habilitar Managed OAuth ou OAuthProvider homologado, conferir metadata RFC9728, PKCE, 401 e refresh.
4. Testar MCP Inspector (initialize, tools/list, tools/call) sem login, com login de proprietário e com login não autorizado.
5. Testar autorização por ferramenta, rate limit, replay, logs redigidos e audit trail.
6. Testar segunda conta ChatGPT após conexão explícita, verificar roles por e-mail e estabilidades dos schemas.
7. Assinar snapshot/hash de `tools/list`, não ativar writes em produção até canário.
8. Deploy protegido com rollback, documentação em português.

## Referências open source verificadas
- https://github.com/cloudflare/agents/tree/main/examples/mcp-worker-authenticated (SDK 2, OAuth, stateless)
- https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-cf-access (Access OAuth, MIT)
- https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/secure-mcp-servers/
- https://developers.cloudflare.com/agents/model-context-protocol/guides/remote-mcp-server/
- https://github.com/cronogramaatp-code/Cripto-agentes (referência arquitetural privada; **não copiar segredos**)

## Limites atuais
Sem domínio MCP, aplicação Access e escopos OAuth configurados, **não existe URL conectável nem acesso efetivo por segunda conta**. Não presumir que o MCP está pronto a partir deste README.
