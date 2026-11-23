# SEC-02 — Triagem das vulnerabilidades remanescentes

Branch: `security/next-16-4-patch`  
HEAD de referência: `ec8cfa2b2cb2ff90d16d9fba70f21d87c4efd6fc`  
Base pós-SEC-01: `next@16.4.6` / `eslint-config-next@16.4.6`  
PR #4: https://github.com/alefeio/oraora/pull/4

**Escopo:** diagnóstico e classificação. **Nenhuma atualização de dependência foi aplicada neste gate.**

Evidências: `sec-02-audit-all.json`, `sec-02-audit-prod.json`, `sec-02-audit-index.json`, `sec-02-audit-summary.json`.

## 1. Separação Production × desenvolvimento

| Comando | Total | critical | high | moderate |
|---|---:|---:|---:|---:|
| `npm audit` (all) | **17** | 2 | 7 | 8 |
| `npm audit --omit=dev` | **10** | 2 | 7 | 1 |

### Runtime de Production (código de app / Vercel Functions)

| Pacote | Papel no Ora Ora | Evidência |
|---|---|---|
| `@vercel/functions` | Direto; `attachDatabasePool` em `src/lib/db/pool.ts` quando `VERCEL` | Import real no path serverless |
| `@vercel/oidc` → `@vercel/cli-config` → `zod@4.1.11` | Transitivo de `@vercel/functions` | Árvore npm; **não** é o `zod@4.6.7` da app |
| `zod@4.6.7` | Direto; validação de APIs (`prayers`, `prayer-requests`, admin) | Import em rotas; **já patchado** (≥4.6.6) |
| `@prisma/client` / adapter-pg | Runtime de dados | Imports gerados / pool |

### Build / CLI (instalado em Production na Vercel, mas fora do path HTTP)

| Pacote | Papel | Evidência |
|---|---|---|
| `prisma` + `@prisma/config` + `effect@3.20.0` | `prisma generate` / migrate / postinstall | Em `dependencies`; **sem** `import` de `prisma`/`effect` em `src/` |
| Next build machine | Gera client; não serve Effect Schema a usuários | Build log SEC-01 |

### Desenvolvimento / CI (ferramentas locais)

| Pacote | Papel | Evidência |
|---|---|---|
| `vitest`, `tinypool`, `@vitest/mocker` | Testes unitários | `devDependencies`; `vitest.config.ts` sem UI server |
| `typescript-eslint*`, `minimatch` (via eslint) | Lint | `eslint-config-next` |

**Atenção ao audit `--omit=dev`:** `vitest`/`tinypool` ainda aparecem porque `better-auth` declara `vitest` como **peerOptional** e o pacote está instalado. Isso **não** prova inclusão no bundle Next. Não há imports de `vitest`/`tinypool` em `src/`. Classificar como **dev/CI**, não como superfície HTTP de Production.

## 2. Matriz de risco

### Críticas

| # | Advisory | Sev | Pacote / versão | Corrigido em | Direto/trans. | Camada | Condição de exploração | Exposição no Ora Ora | Impacto | Prioridade | Correção | Risco de regressão |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 | GHSA-5xrq-8626-4rwp | critical | `vitest@3.2.4` | ≥3.2.6 (parcial) / 4.x | direto (dev) | Dev/CI | UI/API server do Vitest escutando e acessível | **Não** — `vitest run` em CI/local; config sem `ui`/`api` | Leitura/execução de arquivo em máquina de dev/CI | **P2** | Subir Vitest (preferir 4.x) em gate futuro | Médio (major 4.x) |
| C2 | GHSA-82fw-gwwq-j7x9 | moderate† / audit eleva via vitest | `vitest` / `@vitest/mocker@3.2.4` | ≥4.1.11 | trans. | Dev/CI | Mocker redirect / UI | Só em testes | Path traversal em tooling | **P2** | Vitest 4.x | Médio |
| C3 | GHSA-5gmw-xhrv-c9v3 | critical | `tinypool@1.1.1` via vitest | ≥2.1.1 | trans. | Dev/CI | Prototype pollution + opções de worker | Só se PP existir **e** Vitest/tinypool executar workers | RCE em worker de teste/CI | **P2** | Vitest 4 (remove tinypool 1.x) ou override cauteloso | Médio/alto se override |
| C4 | GHSA-85c8-ppgw-ccpr | critical | `tinypool@1.1.1` | ≥2.1.2 | trans. | Dev/CI | PP em `Object.prototype.filename` + `pool.run(_, options)` | Idem C3 | RCE em worker | **P2** | Idem C3 | Médio/alto |

† Severidade “critical” no total do audit agrega o pacote `vitest`; advisories individuais de mocker são moderate.

### Altas (Production / build)

| # | Advisory / cadeia | Sev | Pacote / versão | Corrigido em | Direto/trans. | Camada | Condição | Exposição Ora Ora | Impacto | Prioridade | Correção | Regressão |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| H1 | GHSA-mrhx-c7xc-m3w5 via pin | high | `zod@4.1.11` em `@vercel/cli-config@0.3.4` | zod ≥4.6.6; cli-config ≥0.3.6 / 0.4.0 | trans. | Runtime deps (OIDC chain) | Array enorme sem limite em schema Zod vulnerável | App usa `zod@4.6.7` nas APIs. Cópia 4.1.11 serve config local CLI/OIDC, **não** o body das rotas. `attachDatabasePool` não valida payloads de usuário com essa cópia. | DoS memória **se** a cópia vulnerável validasse input não confiável | **P1** | Atualizar `@vercel/functions` → ≥3.11.3 (puxa `@vercel/oidc@4.0.9` → `@vercel/cli-config@0.4.0` com `zod: ^4.6.6`) | Baixo |
| H2 | (mesmo H1) | high | `@vercel/functions@3.10.4` | ≥3.10.6 / **3.11.3** | direto | Runtime Vercel | Herda H1 | Em uso real no pool | Scanner high; exploração HTTP improvável no uso atual | **P1** | Patch `@vercel/functions` | Baixo |
| H3 | (mesmo H1) | high | `@vercel/oidc@4.0.4` | ≥4.0.6 / **4.0.9** | trans. | Runtime deps | Herda H1 | Transitivo | Idem | **P1** | Via bump de functions | Baixo |
| H4 | (mesmo H1) | high | `@vercel/cli-config@0.3.4` | ≥0.3.6 / **0.4.0** | trans. | Runtime deps | Parse de config local | Não é parser de request HTTP do Ora Ora | Idem | **P1** | Via bump de functions | Baixo |
| H5 | GHSA-7589-6fvf-x4pw | high | `effect@3.20.0` via `@prisma/config@7.10.1` | effect ≥3.22.1 | trans. | Build/CLI Prisma | `Schema.TemplateLiteral` com ≥2 spans `String` + input não confiável | App **não** importa `effect`. Prisma Config usa Effect internamente em generate/CLI | ReDoS no processo de build/CLI se input hostil alcançasse esse schema | **P1** (monitorar) | **Não** fazer downgrade de Prisma. Aguardar Prisma pin; ou override aprovado `effect@3.22.1` em gate futuro | Médio (override) |
| H6 | (cadeia H5) | high | `prisma@7.10.1` / `@prisma/config` | npm sugere 6.12.0 (**downgrade — proibido**) | direto/trans. | Build/CLI | Herda H5 | Generate/migrate | Scanner high | **P1** | Manter 7.x; override effect ou upgrade Prisma quando disponível | — |

### Moderadas (dev)

| # | Advisory | Pacote | Camada | Prioridade | Notas |
|---|---|---|---|---|---|
| M1–M6 | minimatch / typescript-eslint* | via `eslint-config-next` | Dev lint | **P2** | Sem exposição Production; acompanhar com próximos patches Next/eslint |
| M7 | GHSA-qxg6-89mg-rqv8 etc. | `@vitest/mocker` | Dev | **P2** | Com Vitest 4.x |

## 3. Plano de correção (recomendado — não executado)

### P0 — Explorável / crítico em Production HTTP

**Nenhum finding P0 com evidência de exploração no path de request do Ora Ora.**

As críticas do audit (`vitest`/`tinypool`) não têm servidor Vitest exposto nem imports no runtime. As altas de Zod vulnerável estão na cópia pinada do `@vercel/cli-config`, não nas schemas das APIs (`zod@4.6.7`).

### P1 — Antes do lançamento funcional (recomendado)

1. **SEC-03a (baixo risco):** atualizar somente `@vercel/functions` para a última 3.11.x compatível → limpa `@vercel/oidc` / `@vercel/cli-config` / `zod@4.1.11`.
2. **SEC-03b (Prisma/Effect):** sem downgrade. Opções: (a) aguardar release Prisma com `effect≥3.22.1`; (b) override pontual `effect@3.22.1` sob aprovação explícita + `npm ci`/generate/testes.
3. Confirmar em Preview pós-SEC-03a que pool Vercel e auth continuam ok.

### P2 — Dev / CI planejado

1. Subir **Vitest para 4.x** (remove tinypool 1.x e limpa advisories de UI/mocker). Evitar `npm audit fix --force`.
2. Alternativa menor: Vitest ≥3.2.6 + avaliação de override `tinypool@2.1.2` (maior risco de incompatibilidade com Vitest 3).
3. ESLint/typescript-eslint/minimatch: via atualizações futuras de `eslint-config-next`.

### Controles já existentes que reduzem risco

- Schemas Zod da API usam `.max(...)` em strings (limites explícitos).
- Vitest: `environment: "node"`, sem UI; uso `vitest run`.
- Better Auth / Next 16.4.6 já no patch SEC-01.
- Preview com proteção SSO.

## 4. Bloqueadores para o primeiro lançamento

| Item | Bloqueia go-live? | Motivo |
|---|---|---|
| Vitest / tinypool criticals | **Não** (com controles) | Dev/CI; sem UI exposta |
| Cadeia `@vercel/functions` → zod 4.1.11 | **Não hard-block**; **recomendado corrigir antes** | Scanner high; exploração HTTP no uso atual improvável |
| Prisma → effect ReDoS | **Não hard-block** | Build/CLI; sem uso app de TemplateLiteral |
| Downgrade Prisma sugerido pelo npm | **Não fazer** | Proibido neste programa |

**Recomendação fundamentada:** o lançamento funcional **não** está bloqueado por exploração HTTP comprovada das críticas do audit. Antes de publicar, priorizar o bump isolado de `@vercel/functions` (P1, baixo risco). Tratar Vitest 4.x e Effect/Prisma em gates seguintes, sem `audit fix --force` e sem downgrade de Prisma.

## 5. Restrições observadas

- Sem alterações de código funcional, auth, API, DB, Design System.
- Sem merge do PR #4.
- Sem deploy Production, migrations ou seeds.
- Sem implementação automática das correções propostas.
