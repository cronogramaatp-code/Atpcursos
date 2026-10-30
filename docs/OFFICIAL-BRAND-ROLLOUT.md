# atpconcursos — Aplicação inicial da identidade oficial

## Identidade definida
Nome comercial: **atpconcursos**, com letras minúsculas.
Paleta oficial permanente: `#153F59`, `#245F7A`, `#DFEBF2`, `#F17950`, `#FFFFFF`, `#F5F6F2`, `#1B252D`, `#717A80`, `#E2E6E8`, `#EDF1F3`.

## Mudanças efetivas em branch isolada
- Tokens centrais e overrides de CSS acrescentados ao fim de `src/design.ts`, prevalecendo sobre a folha legada para as superfícies principais (loja, vendas, aluno e ADM).
- Botão coral `#F17950` com texto grafite `#1B252D`; links `#245F7A` sobre branco; título e fundo azul `#153F59`.
- Cabeçalho usa o emblema ATP original presente no repositório e **texto simples atpconcursos**, em vez do antigo arquivo de wordmark. A geometria do emblema não foi alterada.
- Nome comercial atualizado nas mensagens e cópia pública dos módulos afetados, incluindo loja, e-mails de compra e alertas.
- Manifest do PWA alterado para o novo nome e as cores da paleta, com atualização da versão de cache do service worker. A URL do produto não foi alterada.

## Pendências importantes antes de aprovação final
1. Os PNG/JPG/SVG de marca **não foram recoloridos** nesta fase; ainda são variantes legadas. Exige derivação visual da logo original enviada pelo proprietário, mantendo triângulo e seta integrados, com aprovação de proporções e cores.
2. A folha CSS contém declarações legadas antigas anteriores ao bloco final. O novo bloco prevalece nas superfícies principais; auditoria visual de componentes e remoção controlada do legado são necessárias antes de afirmar conformidade cromática integral.
3. Screenshots e verificação real de UI em 320/375/390/768/1440px, zoom 200%, foco, teclado e leitor de tela ainda precisam de execução; testes estáticos de contraste não substituem inspeção de navegador.
4. O domínio antigo **atpcursos.cronogramaatp.com.br** continua em uso. Somente após configurar DNS/SSL e o novo host deverá ser alterado canonical/sitemap/URLs de e-mail; **não fazer alteração isolada do canonical sem migração de domínio**.
5. Não modificar a configuração de compra, segredos, dados do aluno ou integração com outros projetos.

## Evidência
Testes automatizados de identidade, cores, contraste, HTML e PWA estão na suíte do repositório. O lançamento depende dos Quality Gates financeiro, jurídico e de segurança.
