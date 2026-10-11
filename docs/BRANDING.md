# Identidade visual e PWA — ATPCursos

**Fonte:** emblema metálico ATP fornecido pelo proprietário, encontrado na área de trabalho do VAIO e preservado em `assets/brand/source-logo.jpeg`. O pipeline usa essa fonte, sem trocar o emblema por uma logo gerada.

## Aplicações
- Header da loja, produtos, administração e páginas de cliente: `/brand/logo-atp.png`
- Ícone da aba: `/brand/favicon.ico` e `/brand/favicon-32.png`
- iOS: `/brand/apple-touch-icon.png` (180x180)
- Android/PWA: `/brand/icon-192.png`, `/brand/icon-512.png` e ícone maskable 512x512
- Compartilhamento: `/brand/og-atpcursos.jpg` (1200x630), OpenGraph e Twitter Card, URLs absolutas calculadas pelo Worker
- Webmanifest: `/manifest.webmanifest`
- Service worker: `/sw.js`, cache exclusivamente de recursos públicos

## Atualização
No Windows:
```powershell
.\tools\build-brand.ps1 -Source "C:\caminho\logo-atp-original.jpeg" -ProjectRoot "."
```
Os binários resultantes precisam ser commitados junto com o código. Rodar teste dos pixels/dimensões e inspecionar a prévia social. Nunca armazenar PDFs pagos, clientes, dados de pagamento ou segredos no service worker.

## Critérios de QA
- Nenhum placeholder textual "▲ ATP" ou selo genérico na interface
- Favicon, Apple Touch, PWA 192/512, maskable e OG válidos e servidos por HTTPS
- `og:image` e `twitter:image` com URLs absolutas do host real
- PWA instalável e rota `/loja` abre sem login
- Admin, e-mails, PDF e conta NÃO ficam em cache offline
- Documentar domínio e validar compartilhamento real após deploy e DNS
