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
3. Confirmar que `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` apontam para o domínio fixo.
4. Smoke: `/api/v1/health`, login Conta B, `/account/oracoes`, reconciliação.

## Não fazer

- Merge na `main`
- Escrita em Production
- Aplicar scripture no Preview sem autorização explícita do proprietário

## Script auxiliar

```bash
npx tsx scripts/prepare-homologation-alias.ts --check
```
