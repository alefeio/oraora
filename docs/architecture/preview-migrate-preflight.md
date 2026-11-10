# Gate 2.5 — Preflight de migrations no Preview

## Status

| Item | Valor |
|---|---|
| Preflight | **PASS** |
| Execução autorizada | **PASS** — `migrate deploy` em `oraora-preview` (`store_xYaw5J0xe3Gb9T89`) |
| Target | `oraora-preview` (`store_xYaw5J0xe3Gb9T89`) |
| Production | **UNCHANGED** (`prisma-postgres-oraora` / `store_sVF0L5GhFshjZfVP`) |
| Migrations | **4/4 aplicadas** (commit auditado `e5e10d3`) |
| Seeds | **NO** |

## 1. Identificação do destino (verificado)

| Ambiente | Recurso | Store ID | Conexão no projeto `oraora` |
|---|---|---|---|
| Preview | `oraora-preview` | `store_xYaw5J0xe3Gb9T89` | somente `preview` |
| Production | `prisma-postgres-oraora` | `store_sVF0L5GhFshjZfVP` | somente `production` |

Variáveis PostgreSQL com escopos **exclusivos** (sem linha compartilhada Preview+Production):

- `DATABASE_URL`, `DATABASE_URL_POOLED`, `POSTGRES_URL`, `PRISMA_DATABASE_URL`

Fingerprints de credencial (SHA-256 truncado, sem revelar secretos) **diferem** entre Preview e Production.

Auth Preview preservada: `BETTER_AUTH_SECRET` presente; `AUTH_EMAIL_MODE=resend`.

## 2. Estado inicial do banco Preview (somente leitura)

Probe read-only em `DATABASE_URL` do Preview:

- `publicTableCount`: **0**
- `_prisma_migrations`: **ausente**
- Migrations aplicadas: **nenhuma**

Conclusão: banco novo / vazio — as **quatro** migrations do repositório estão **pendentes**.

## 3. Migrations pendentes (ordem)

| # | Pasta | Natureza |
|---|---|---|
| 1 | `20261109180000_sprint_f_foundation` | `CREATE` auth Better Auth, audit, policies, idempotency |
| 2 | `20261109190000_sprint_1_prayer_discovery` | `CREATE` categorias e pedidos |
| 3 | `20261109200000_sprint_2_intercession_reciprocity` | `CREATE` orações, validação, elegibilidade, escrituras |
| 4 | `20261110020000_sprint_2_1_hardening` | `DROP INDEX IF EXISTS` + `CREATE UNIQUE INDEX` (expressão) + coluna `moderationPending` + tabela de revisões |

`migration_lock.toml`: provider PostgreSQL.

### Compatibilidade / riscos

- Adequadas a PostgreSQL remoto (tipos/`JSONB`/`TIMESTAMP(3)`/FKs padrão).
- Dependências encadeadas (2→1, 3→1+2, 4→3). Em banco vazio, aplicar em sequência via `migrate deploy`.
- **Não destrutivas de dados** neste contexto (banco vazio). Único `DROP` é índice com `IF EXISTS`.
- FKs com `ON DELETE CASCADE` são de schema, não apagam dados existentes agora.
- Índice único com `COALESCE("userId", '')` é suportado no PostgreSQL.
- **Proibido** `prisma db push`.
- **Não** usar `npm run db:migrate:deploy` (passa por `db:assert-local` e bloqueia remoto — correto para o dia a dia local).
- **Não** usar `ALLOW_REMOTE_DB_WRITE=true` como override genérico.

## 4. Comando seguro de execução (após autorização explícita)

Pré-condições no momento da execução:

1. `vercel integration resource inspect oraora-preview` → connected `oraora (preview)`.
2. `vercel integration resource inspect prisma-postgres-oraora` → connected `oraora (production)` apenas.
3. Confirmar verbalmente/escrito: autorizar migrate **somente** em `oraora-preview`.
4. Comparar fingerprint Preview ≠ Production (sem imprimir URLs).

Procedimento (PowerShell, exemplo):

```powershell
# A) Identidade dos recursos (metadados)
npx vercel integration resource inspect oraora-preview --scope alefeios-projects
npx vercel integration resource inspect prisma-postgres-oraora --scope alefeios-projects

# B) Baixar somente Preview (arquivo temporário; apagar depois)
npx vercel env pull .env.preview.migrate.tmp --environment preview --scope alefeios-projects --yes

# C) Exportar APENAS a URL direta do Preview para o processo
#    (não reutilizar Production; não deixar DIRECT_URL local do .env.local vencer)
#    Carregar DATABASE_URL do arquivo tmp; definir:
$env:DATABASE_URL = "<somente DATABASE_URL Preview do tmp>"
$env:DIRECT_URL   = $env:DATABASE_URL
Remove-Item Env:DATABASE_URL_POOLED, Env:RUNTIME_DATABASE_URL, Env:POSTGRES_URL, Env:PRISMA_DATABASE_URL -ErrorAction SilentlyContinue
# Garantir que variáveis de shell tenham precedência sobre .env.local (dotenv não sobrescreve existentes)

# D) Verificação explícita imediatamente antes
#    - host deve ser db.prisma.io (direto), nunca localhost
#    - fingerprint deve bater com o Preview e diferir de Production
#    - CONFIRMAR: CONFIRM_PREVIEW_MIGRATE_TARGET=oraora-preview

$env:CONFIRM_PREVIEW_MIGRATE_TARGET = "oraora-preview"

# E) Deploy das migrations (único comando de escrita de schema autorizado)
npx prisma migrate deploy

# F) Pós-check read-only
npx prisma migrate status
# Esperado: 4 migrations aplicadas; tabelas de domínio presentes

# G) Limpeza
Remove-Item .env.preview.migrate.tmp -Force
Remove-Item Env:DATABASE_URL, Env:DIRECT_URL, Env:CONFIRM_PREVIEW_MIGRATE_TARGET
```

Notas:

- Usar **somente** `DATABASE_URL` / `DIRECT_URL` diretos do Preview — nunca pooled para `migrate deploy`.
- `prisma.config.ts` resolve a URL direta via env; variáveis já definidas no shell têm prioridade sobre `.env.local`.
- Seeds e testes com escrita **fora** deste passo, salvo nova autorização.

## 5. Estratégia de recuperação

| Cenário | Ação |
|---|---|
| Falha no meio do `migrate deploy` em Preview vazio | Inspecionar `migrate status`; corrigir; reexecutar `migrate deploy` (Prisma retoma). Se irrecuperável: **recriar** resource Preview (Production intocada). |
| Suspeita de apontar para Production | **Abortar imediatamente**. Conferir fingerprints e `resource inspect`. Não “consertar” com migrate em Production. |
| Rollback de produto | Não há migrate down. Preview é descartável; Production preservada. |
| Dados sintéticos futuros | Truncate/reseed só no Preview, com autorização. |

## 6. Testes de homologação previstos (após migrate + auth)

Conforme `docs/qa/homologation-journeys.md` e `docs/architecture/preview-homologation.md`:

1. Auth (cadastro/verify/login) com Resend.
2. Descoberta (categorias/feed) — após seed sintético autorizado, se necessário.
3. Intercessão / reciprocidade / admin / idempotência.

Neste Gate 2.5: **não** executar.

## 7. Autorização ainda necessária

Texto sugerido para o proprietário:

> Autorizo `npx prisma migrate deploy` **exclusivamente** no recurso Prisma Postgres `oraora-preview` (`store_xYaw5J0xe3Gb9T89`), ambiente Preview do projeto `alefeios-projects/oraora`. Production (`prisma-postgres-oraora` / `store_sVF0L5GhFshjZfVP`) permanece fora do escopo. Sem seeds nem `db push` neste passo.

Até essa autorização, **MIGRATIONS: NOT EXECUTED**.
