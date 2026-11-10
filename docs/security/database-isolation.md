# Isolamento de banco

## Local (Sprint 2.1)

Postgres local descartável com database `intercessao_dev` (ou `intercessao_test`).

Variáveis (nomes apenas):

| Nome | Escopo |
|---|---|
| `DIRECT_URL` | Prisma CLI / migrations (direta) |
| `DATABASE_URL` | Fallback direto/local |
| `RUNTIME_DATABASE_URL` | Runtime local da aplicação e testes |
| `DATABASE_URL_POOLED` | Runtime **somente na Vercel** |
| `POSTGRES_URL` / `PRISMA_DATABASE_URL` | Integração Prisma Postgres (remoto; não usar para testes/seeds) |
| `DATABASE_ENV` | Rótulo; **não** prova isolamento físico |
| `ALLOW_REMOTE_DB_WRITE` | Override explícito (proibido nesta sprint) |

Guards em `src/lib/db/guards.ts`:

- host deve ser local;
- database deve ser `intercessao_dev` ou `intercessao_test`;
- `VERCEL_ENV=production` bloqueia escrita nesta fundação;
- runtime de testes valida via `assertTestRuntimeIsLocal`.

Resolvedor (`src/lib/db/connection.ts`):

- fora da Vercel, `RUNTIME_DATABASE_URL` / `DATABASE_URL` local têm prioridade absoluta;
- `DATABASE_URL_POOLED` remoto **não** é escolhido automaticamente fora da Vercel;
- na Vercel, runtime prefere pooled; migrations continuam na conexão direta.

## Scripts

`npm run db:assert-local` precede `db:migrate` e `db:migrate:deploy`.

## Preview vs Production

Antes de qualquer deployment futuro, Preview e Production precisam apontar para bancos fisicamente distintos. Homônimos de variável não bastam.

## Proibido nesta sprint

- migrate/seed/testes de escrita no Prisma Postgres remoto da Vercel;
- reset remoto;
- `ALLOW_REMOTE_DB_WRITE=true` sem autorização explícita.
