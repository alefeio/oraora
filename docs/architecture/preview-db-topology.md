# Topologia Preview / Production (banco)

## Status Gate 2.4

| Afirmação | Classificação |
|---|---|
| Quatro variáveis Prisma Postgres existem no projeto Vercel `oraora` | **Verificado** |
| Cada variável está associada a **Preview e Production no mesmo registro** | **Verificado** (`vercel env ls`) |
| Não há overrides por branch Git nas variáveis listadas | **Verificado** (nenhum `gitBranch` visível na listagem) |
| Preview e Production são instâncias físicas distintas | **Verificado** (`oraora-preview` / `store_xYaw5J0xe3Gb9T89` vs `prisma-postgres-oraora` / `store_sVF0L5GhFshjZfVP`; env escopos exclusivos; fingerprints distintos) |
| Migrations remotas aplicadas no Preview | **Não** — preflight Gate 2.5 PASS; execução pendente de autorização |
| Escrita remota autorizada | **Não concedida** para migrate (Gate 2.5 = só preparação) |

## Integração Prisma Postgres → Vercel

Quando um banco Prisma Postgres é conectado, a integração costuma definir:

| Variável | Função típica |
|---|---|
| `DATABASE_URL` | Conexão direta (`db.prisma.io`) — CLI / migrations |
| `POSTGRES_URL` | Alias direto |
| `PRISMA_DATABASE_URL` | Alias direto |
| `DATABASE_URL_POOLED` | Runtime serverless (`pooled.db.prisma.io`) |

## Inventário Vercel (atual — pós-isolamento)

Projeto: `alefeios-projects/oraora` (`prj_JAOMoEe1NysvI0TprfTRmzwMrKYL`).

| Recurso | Store ID | Ambiente |
|---|---|---|
| `oraora-preview` | `store_xYaw5J0xe3Gb9T89` | Preview |
| `prisma-postgres-oraora` | `store_sVF0L5GhFshjZfVP` | Production |

Variáveis PostgreSQL: quatro nomes × dois escopos **exclusivos** (Preview e Production em registros separados).

Auth no Preview: `BETTER_AUTH_SECRET`, `AUTH_EMAIL_MODE=resend`.

Preflight de migrate: `docs/architecture/preview-migrate-preflight.md`.

## Runtime da aplicação

- Fora da Vercel: `RUNTIME_DATABASE_URL` / `DATABASE_URL` local (`intercessao_dev`) têm prioridade; pooled remoto não é escolhido automaticamente.
- Na Vercel: runtime prefere `DATABASE_URL_POOLED`; migrations usam conexão direta.
- Prisma Postgres (Starter) pode rejeitar conexões com `Failed to connect to upstream database` em cold-start / scale-to-zero. O pool da app aplica retry transitório limitado; não substituir pooled por direto sem contingência explícita.
- `/api/v1/health` faz `SELECT 1` no runtime (aquece e diagnostica sem expor credenciais).

## Local

Escrita de testes/seeds/migrations: somente `intercessao_dev` / `intercessao_test` em `127.0.0.1`.
