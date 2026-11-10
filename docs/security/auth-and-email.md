# Autenticação e e-mail — Ora Ora

## Biblioteca

Better Auth + adapter Prisma (`@better-auth/prisma-adapter`).

## Status Gate 2.4

| Item | Classificação |
|---|---|
| Código: Resend obrigatório na Vercel; sem fallback console | **Configurado** (repo) |
| Código: verificação de e-mail sempre on na Vercel | **Configurado** (repo) |
| Código: cadastro público fechado sem Resend | **Configurado** (repo) |
| Código: erros de envio propagam (sem fingir sucesso) | **Configurado** (repo) |
| `BETTER_AUTH_SECRET` no projeto Vercel | **Pendente do proprietário** — **ausente** em `vercel env ls` |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` no Vercel | **Pendente do proprietário** — **ausentes** |
| `AUTH_EMAIL_MODE=resend` + `RESEND_API_KEY` + `AUTH_EMAIL_FROM` | **Pendente do proprietário** — **ausentes** |
| Domínio verificado no Resend | **Pendente do proprietário** |
| Cadastro público funcional no Preview | **Bloqueado por segurança** até itens acima |
| Pronto para usuários reais | **Não** |

## Inventário Vercel (Gate 2.4)

Únicas variáveis listadas no projeto `oraora`: as quatro de banco Prisma.  
**Nenhuma** variável de autenticação/e-mail está presente no painel (listagem CLI).

Local (`.env.local`, fora do Git): `BETTER_AUTH_SECRET` presente; `AUTH_EMAIL_MODE=console`; Resend ausente — adequado só para desenvolvimento.

## Variáveis a configurar (nomes apenas — valores pelo proprietário)

| Variável | Escopo sugerido | Notas |
|---|---|---|
| `BETTER_AUTH_SECRET` | Preview (+ Production depois) | Segredo longo exclusivo do Ora Ora; nunca reutilizar de Kale/outros |
| `BETTER_AUTH_URL` | Preview | URL HTTPS canônica do Preview (ou deixar `VERCEL_URL` com cuidado) |
| `NEXT_PUBLIC_APP_URL` | Preview | Base pública HTTPS |
| `AUTH_EMAIL_MODE` | Preview | Valor literal `resend` |
| `RESEND_API_KEY` | Preview | Conta Resend **deste** projeto |
| `AUTH_EMAIL_FROM` | Preview | Ex.: `Ora Ora <noreply@dominio-verificado>` |

Opcional local apenas: `AUTH_REQUIRE_EMAIL_VERIFICATION`, `AUTH_EMAIL_LOG_PATH`.

## Comportamento hospedado (código)

- `AUTH_EMAIL_MODE=console` na Vercel → erro de configuração.
- Sem `RESEND_API_KEY` / `AUTH_EMAIL_FROM` → cadastro público **desabilitado**; página `/signup` explica o bloqueio.
- Logs de processo **não** incluem URL/token de verificação ou reset.
- Cookies seguros em HTTPS; `trustedOrigins` inclui `BETTER_AUTH_URL` / `VERCEL_URL`.
- Rate limit Better Auth habilitado.

## Procedimento do proprietário (Resend)

1. Criar API key Resend exclusiva Ora Ora (não copiar de outro app).
2. Verificar domínio de envio.
3. Definir `AUTH_EMAIL_FROM` com nome de exibição **Ora Ora**.
4. Inserir as variáveis na Vercel **somente Preview** primeiro.
5. Redeploy da branch de Preview.
6. Testar um cadastro sintético; confirmar e-mail recebido e ausência de links em logs da Vercel.

## Declaração

A autenticação **não** está pronta para uso público enquanto secrets e Resend não estiverem configurados e a homologação autorizada não for executada.
