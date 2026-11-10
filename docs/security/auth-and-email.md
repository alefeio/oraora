# Autenticação e e-mail — Ora Ora

## Biblioteca

Better Auth + adapter Prisma (`@better-auth/prisma-adapter`).

## Estado atual (Sprint 2.3)

| Capacidade | Local | Preview / Production |
|---|---|---|
| Cadastro público | Aberto (dev) | Aberto **somente** com Resend configurado |
| Verificação de e-mail | Opcional via `AUTH_REQUIRE_EMAIL_VERIFICATION` | **Sempre exigida** |
| Recuperação de senha | Hook presente | Hook presente; exige provedor real |
| Rate limit | Sim | Sim |
| Cookies seguros | Em HTTPS | Em HTTPS (`VERCEL_URL` / `BETTER_AUTH_URL`) |

## Provedor de e-mail

Adapter testável em `src/lib/auth/email-transport.ts`.

- `AUTH_EMAIL_MODE=console`: **somente local**. Grava em `tmp/auth-emails.log`. Log de processo **não** inclui URL/token.
- `AUTH_EMAIL_MODE=resend`: envio HTTP à API Resend. Exige `RESEND_API_KEY` e `AUTH_EMAIL_FROM` **deste projeto**.
- Na Vercel, modo `console` é **erro de configuração**. Não há fallback silencioso.
- Falha de entrega **propaga** erro; a aplicação não deve afirmar que o e-mail foi enviado.

## Variáveis necessárias (nomes apenas)

| Variável | Obrigatória | Notas |
|---|---|---|
| `BETTER_AUTH_SECRET` | Sim (runtime) | Segredo forte exclusivo do Ora Ora; **ausente na listagem Vercel observada** — o proprietário precisa criar |
| `BETTER_AUTH_URL` | Recomendada | URL canônica do ambiente (Preview ou domínio) |
| `NEXT_PUBLIC_APP_URL` | Recomendada | Base pública; usada em produção quando definida |
| `AUTH_EMAIL_MODE` | Sim em hospedado | `resend` na Vercel |
| `RESEND_API_KEY` | Sim em hospedado | Conta Resend do projeto; não reutilizar de outros apps |
| `AUTH_EMAIL_FROM` | Sim em hospedado | Remetente com domínio verificado |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Local | Ignorada na Vercel (sempre true) |
| `AUTH_EMAIL_LOG_PATH` | Local | Opcional; default `tmp/auth-emails.log` |

## Declaração explícita

A autenticação **não** está pronta para usuários reais enquanto:

1. `BETTER_AUTH_SECRET` não existir no projeto Vercel;
2. Resend (ou equivalente) não estiver configurado com domínio verificado;
3. o isolamento Preview/Production do banco não estiver comprovado e migrado;
4. a homologação das jornadas remotas não for autorizada e executada.

Cadastro público no Preview permanece **fechado** até o item 2.

## Secrets

Nenhuma chave de outros projetos deve ser reutilizada. Valores ficam só no painel Vercel / `.env.local` (fora do Git).
