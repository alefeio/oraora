# Limitações de Preview e banco remoto

## Builds históricos

Causas já identificadas na Vercel (não reescritas):

- `main` (`cf4ee68`): `prisma generate` antes da existência do schema Prisma no tip.
- Sprint F (`dd71d53`): prerender dinâmico de `/account` sem tratamento adequado ao Next.js 16.

A branch atual de marca/UX herda a fundação posterior e deve ser usada como referência de Preview.

## Banco remoto

O projeto Vercel possui variáveis:

- `DATABASE_URL`
- `DATABASE_URL_POOLED`
- `POSTGRES_URL`
- `PRISMA_DATABASE_URL`

O isolamento físico entre Preview e Production **ainda não foi comprovado**.

Até comprovação explícita:

- não executar migrations remotas;
- não executar seeds remotas;
- não rodar testes com escrita no Prisma Postgres remoto.

Preview READY significa build/deploy HTTP bem-sucedido. Rotas que dependem do schema local poderão falhar no remoto enquanto o banco não estiver preparado.

## Local

Migrations, seeds e `RUN_DB_TESTS=1` permanecem em `intercessao_dev` local.
