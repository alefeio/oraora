# Isolamento de banco

## Local (Sprint F)

Docker Compose sobe PostgreSQL 16 na porta `55433` (evitar colisão com outros projetos) e database `intercessao_dev`.

Variáveis:

- `RUNTIME_DATABASE_URL` — runtime da aplicação (pode ser a mesma URL local).
- `DATABASE_URL` / `DIRECT_URL` — migrations / Prisma CLI.
- `DATABASE_ENV=development|test` — rótulo; não prova isolamento físico sozinho.
- `ALLOW_REMOTE_DB_WRITE=true` — necessário para qualquer escrita não local.

Guards em `src/lib/db/guards.ts` bloqueiam seed/migrate perigosos contra hosts remotos sem confirmação explícita.

## Futuro Vercel + Prisma Postgres

Preparar:

- pooled URL no runtime;
- direct URL nas migrations (`prisma.config.ts`);
- projetos/bancos **separados** de Kale e Alexandre Feio;
- produção distinta de preview/dev.

Nesta sprint: **nenhum** banco de produção, **nenhum** recurso pago e **nenhum** deploy.
