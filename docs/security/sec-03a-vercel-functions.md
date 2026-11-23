# SEC-03a — Correção controlada de `@vercel/functions`

Branch: `security/sec-03a-vercel-functions`  
Base: `security/next-16-4-patch` @ `d29143d28b9ac3846dee25600206766d537c3e0d`

## Decisão

**Selecionada: `@vercel/functions@3.10.6` (pin exact).**

| Candidata | Cadeia Zod | Cache Components / `#17830` | Notas |
|---|---|---|---|
| 3.10.6 | `oidc@4.0.6` → `cli-config@0.3.6` → `zod@^4.6.6` ✅ | Sem o bug `Date.now()` no checkout ✅ | **Menor bump** a partir de 3.10.4 |
| 3.11.2 | `oidc@4.0.9` → `cli-config@0.4.0` → `zod@^4.6.6` ✅ | OK (hold da issue) | Maior superfície que o necessário |
| 3.11.3 | mesma de 3.11.2 ✅ | **Falha** prerender com `Date.now()` em `attachDatabasePool` ❌ | [vercel/vercel#17830](https://github.com/vercel/vercel/issues/17830) aberto |

Antes: `@vercel/functions@3.10.4` → `oidc@4.0.4` → `cli-config@0.3.4` → **`zod@4.1.11`** (GHSA-mrhx-c7xc-m3w5).  
Depois: única cópia `zod@4.6.7` na árvore relevante.

Sem overrides. Sem mudanças em `attachDatabasePool` / arquitetura de pool. Sem SEC-03b/03c.

## Validação

| Check | Resultado |
|---|---|
| Cadeia Zod | `zod@4.6.7` único; sem `4.1.11` |
| `npm audit` | 17→**13** (high 7→**3**; vercel/zod limpos) |
| `npm audit --omit=dev` | 10→**6** |
| Lint | PASS |
| Typecheck | PASS |
| Build (Cache Components) | PASS — sem erro `Date.now()` no prerender |
| Unit | 54 PASS / 2 skipped (`http-authz`); +teste `#17830` |
| DB tests | NÃO EXECUTADOS |

`attachDatabasePool` preservado; retries transitórios intactos.
