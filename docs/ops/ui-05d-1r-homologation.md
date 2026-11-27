# UI-05D.1R — Homologação controlada (domínio fixo)

Endereço fixo: `https://homologacao.oraora.ia.br`  
Banco: Preview `oraora-preview` / `store_xYaw5J0xe3Gb9T89`  
PR: `#13` · branch `fix/ui-05d-1-prayer-reliability`

## Objetivo

Apontar o domínio de homologação para o deployment do PR #13 **sem** merge na `main` e **sem** alterar Production.

## Variáveis Better Auth (Preview / domínio de homologação)

Manter no ambiente Preview (ou no deployment alvo do alias):

| Variável | Valor |
|---|---|
| `BETTER_AUTH_URL` | `https://homologacao.oraora.ia.br` |
| `NEXT_PUBLIC_APP_URL` | `https://homologacao.oraora.ia.br` |

`trustedOrigins` já inclui `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` e `VERCEL_URL`.

## Passos (Vercel)

1. Confirmar deployment Preview do commit HEAD do PR #13.
2. Atribuir alias/domínio `homologacao.oraora.ia.br` a esse deployment (não ao Production).
3. Confirmar que `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` apontam para o domínio fixo **na branch** `fix/ui-05d-1-prayer-reliability` (não só em `feature/ui-05d-prayer-journey`).
4. Smoke: `/api/v1/health`, login Conta B, `/account/oracoes`, reconciliação.

### Executado em UI-05D.1R

- Alias `homologacao.oraora.ia.br` → deployment do PR #13 / branch `fix/ui-05d-1-prayer-reliability`.
- **Vínculo permanente:** `PATCH /v9/projects/oraora/domains/homologacao.oraora.ia.br` com `gitBranch=fix/ui-05d-1-prayer-reliability` (confirmado via `get_project_domain`).
- `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` = `https://homologacao.oraora.ia.br` no Preview da branch do PR.
- Redeploy da branch para carregar as variáveis.
- Observação: health via CLI pode responder 401 por proteção SSO da Vercel; smoke autenticado no browser permanece necessário.

```bash
npx tsx scripts/prepare-homologation-alias.ts --check
npx tsx scripts/prepare-homologation-alias.ts --apply
```

## Não fazer

- Merge na `main`
- Escrita em Production
- Aplicar scripture no Preview sem autorização explícita do proprietário

## Script auxiliar

```bash
npx tsx scripts/prepare-homologation-alias.ts --check
```
