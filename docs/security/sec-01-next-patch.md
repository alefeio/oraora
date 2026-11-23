# SEC-01 — Atualização controlada Next.js 16.4.x

Branch: `security/next-16-4-patch`  
Base: `feature/ui-05a-visual-foundation` @ `a449e320df7126ffa71dc5d15b1219a1421a7fe9`  
Worktree: independente (sem misturar com UI-05A)

## Diagnóstico

| Pacote | Antes | Depois |
|---|---|---|
| `next` | 16.4.3 | **16.4.6** (última estável 16.4.x) |
| `eslint-config-next` | 16.4.3 | **16.4.6** |

Referência oficial: [November 2026 Security Release](https://nextjs.org/blog/november-2026-security-release) (corrigido em **16.4.5**). **16.4.6** é backport de bugs sem novos advisories e permanece fora do intervalo afetado (`<=16.4.4`).

### Advisories Next.js (confirmados em 16.4.3)

| ID | Severidade | Condição | Relevante ao Ora Ora? |
|---|---|---|---|
| GHSA-mfr8-8qww-v76h | High/Moderate | `use cache` + `unstable_cache` + root params | Baixa — `cacheComponents: true`, mas **sem** `"use cache"` / `unstable_cache` no código |
| GHSA-vc7v-qv4w-wrv8 | Moderate | nested `use cache` + root params | Baixa — sem `use cache` |
| GHSA-rhh4-g77r-r9qj | Moderate | args binários em `use cache` | Baixa — sem `use cache` |
| GHSA-vvgp-ww4w-46vf | Moderate | shell compartilhado com Partial Prefetching **off** | Não — `partialPrefetching: true` |
| GHSA-pc58-hwjq-p385 | Moderate | self-host + Response fetched repassado + HTTP/1.1 pipelining | Baixa — hospedagem Vercel; sem padrão de forward de Response atacante |
| GHSA-f3mh-rxg3-f5g2 | Moderate | Edge routes setando cookies sensíveis via `NextResponse.cookies.set` | Baixa — `proxy.ts` só lê cookies / redireciona |
| GHSA-7qx7-33qx-rqx2 | Moderate | image optimization SVG bypass | Baixa — logos locais; `dangerouslyAllowSVG` padrão false |

Patch aplicado mesmo assim: versão na faixa afetada (`16.4.3`) e `npm audit` listava `next` com `fixAvailable: 16.4.6`.

### npm audit

| | Total | moderate | high | critical |
|---|---:|---:|---:|---:|
| Antes | 18 | 9 | 7 | 2 |
| Depois | 17 | 8 | 7 | 2 |

Vulnerabilidades restantes **não** são de `next` (outras deps transitivas). **Não** se usou `npm audit fix --force`. React, Prisma, Better Auth e Tailwind **não** foram atualizados.

## Escopo da correção

Somente `package.json` + `package-lock.json` (`next`, `eslint-config-next`) + este relatório. Sem alterações de produto, auth, API, Prisma ou UI.

## Validação

| Check | Resultado |
|---|---|
| `npm ci` | PASS |
| Lint | PASS |
| Typecheck | PASS |
| Build | PASS (`Next.js 16.4.6`) |
| Unit (baseline UI-05A) | 53 PASS / 2 skipped (`http-authz`) |
| DB tests | NÃO EXECUTADOS |
| Smoke `/`, `/login`, `/signup`, `/esqueci-minha-senha`, `/robots.txt` | 200 |
| Overflow homepage 320–1440 | PASS |
| Regressões vs UI-05A | Nenhuma observada |

`npm audit fix --force` **não** utilizado. PR #3 **não** incorporado. Production/merge **não** executados.
