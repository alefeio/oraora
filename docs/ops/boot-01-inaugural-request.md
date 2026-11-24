# BOOT-01 / BOOT-01R — Inicialização da primeira corrente de oração

Branch: `feature/boot-01-inaugural-request`  
PR: #10  

## Problema

Sem pedidos na fila, ninguém ora; sem oração validada, ninguém publica. A reciprocidade permanente está correta — falta um bootstrap inaugural **único e auditável**.

## Mecanismo (sem migration)

1. **Lock global atômico:** `PolicyDocument` com `domain=community_bootstrap` + `version=1` (`@@unique([domain, version])`).
2. Na mesma transação: cria elegibilidade `admin_grant` + evento de auditoria.
3. Pedido inaugural **somente** via UI `/pedir` (fluxo normal).

### Identificação do banco (BOOT-01R)

O apply exige fingerprint alinhado:

| Declarado | Exigência |
|---|---|
| `local` | host local + database em `intercessao_dev\|intercessao_test` + DIRECT/runtime com mesmo database |
| `preview` | host não local + `BOOTSTRAP_PREVIEW_DATABASE=<dbname>` igual ao runtime + `ALLOW_REMOTE_DB_WRITE=true` |
| Production | sempre recusado (`VERCEL_ENV=production` ou host “prod”) |

`--env=preview` ou `ALLOW_REMOTE_DB_WRITE` **sozinhos** não bastam.

### Auditoria

| Campo | Conteúdo |
|---|---|
| `actorType` | `admin` só se `--operator-admin=<id>` com `role=ADMIN` verificado no mesmo banco |
| | `system` para operador CLI (`--operator=system:…`) |
| `actorUserId` | admin verificado ou `null` (system) |
| metadata | `beneficiaryUserIdPrefix`, `operatorKind` — fundador **não** é fingido como admin |

### Comandos

```bash
# Inspeção read-only
npm run boot:inspect -- --env=local

# Dry-run (padrão)
npm run boot:inaugural -- --env=local --founder=<userId>

# Apply local (após autorização)
npm run boot:inaugural -- --env=local --founder=<userId> --confirm=OWNER_AUTHORIZED

# Preview apply (somente com autorização explícita do proprietário)
BOOTSTRAP_PREVIEW_DATABASE=<dbname> ALLOW_REMOTE_DB_WRITE=true \
  npm run boot:inaugural -- --env=preview --founder=<userId> \
  --operator=system:owner-cli --confirm=OWNER_AUTHORIZED
```

## Postgres local (BOOT-01R)

Diagnóstico: o serviço em `127.0.0.1:51218` (prisma-dev / `.env.local`) estava **indisponível**.  
Porta `5432` também fechada. **Não** se substituiu a conexão local pelo banco remoto.

Validação de integração usou container Docker **isolado** (sem escrita no Preview):

| Item | Valor |
|---|---|
| Container | `oraora-boot01-pg` |
| Image | `postgres:16-alpine` |
| Database | `intercessao_test` |
| User | `intercessao` |
| Host/porta | `127.0.0.1:55433` |
| Migrations | `prisma migrate deploy` no container |

Se o Docker local estiver parado: marcar **LOCAL POSTGRES: BLOCKED** e não rodar cenários de escrita remota.

## Proposta futura (não implementada) — fila vazia de novo

Opções seguras para gate próprio: descoberta do inaugural ainda `open` fora da fila; arquivo de cuidado; aviso com link direto. Sem novo `admin_grant` automático.

## Inspeção Preview (somente leitura) — BOOT-01R / BOOT-01P

### BOOT-01R (URLs remotas do `.env.local`)

- Fingerprints locais **≠** Preview Vercel (instância errada / obsoleta).
- Schema do app ausente naquela conexão → `ELIGIBLE` UNKNOWN naquele alvo.

### BOOT-01P (Vercel Preview autenticado)

| Item | Evidência |
|---|---|
| Projeto | `alefeios-projects/oraora` (`prj_JAOMoEe1NysvI0TprfTRmzwMrKYL`) |
| Recurso Preview | `oraora-preview` / `store_xYaw5J0xe3Gb9T89` → conectado **somente** `oraora (preview)` |
| Recurso Production | `prisma-postgres-oraora` / `store_sVF0L5GhFshjZfVP` → **somente** `oraora (production)` |
| Env scopes | `DATABASE_URL*` / `POSTGRES_URL` / `PRISMA_DATABASE_URL` exclusivos Preview ≠ Production |
| Branch homologada | `feature/ui-05c-authenticated-surfaces` (alias git Preview Ready) |
| Direct/runtime | `db.prisma.io` + `pooled.db.prisma.io`, database `postgres`, schema app **presente** |
| Migrations | **4/4** aplicadas, nenhuma unfinished |
| Contagens | users=1; real requests=0; open visible=0; open eligibility=0; admin_grant=0; bootstrap policy=ausente |
| Fundador (candidato único) | `idPrefix=ba3pO5iO`, e-mail `ora…@gmail.com`, role `USER`, verificado, criado `2026-11-11` — **confirmar com o proprietário** |
| Elegível | **YES** (estado comunitário vazio de bootstrap) |
| Escritas neste gate | **NONE** |

`BOOTSTRAP_PREVIEW_DATABASE=postgres` (nome do database na instância Preview; identidade real = store + fingerprint Vercel).

### Evidências de testes locais (Docker `55433` / `intercessao_test`)

- Unit db-target: **7/7 PASS**
- DB inaugural + concorrência (conexões independentes): **4/4 PASS** (11 testes no total do arquivo conjunto)
- Concurrent grant: exatamente **1** `admin_grant` + **1** `PolicyDocument` lock

## Pendência do proprietário

1. Confirmar que a conta `idPrefix=ba3pO5iO` (`ora…@gmail.com`) é a fundadora homologada.
2. Autorizar grant **somente** em `oraora-preview` (`store_xYaw5J0xe3Gb9T89`) com `--confirm=OWNER_AUTHORIZED`.
3. Criar pedido inaugural pela UI `/pedir` no Preview homologado.

**PREVIEW GRANT EXECUTED: NO**
