# PRAYER-VALIDATION-02R — Homologação

Endereço fixo: `https://homologacao.oraora.ia.br`  
Banco: Preview `oraora-preview` / `store_xYaw5J0xe3Gb9T89`  
PR: `#14` · branch `feature/prayer-validation-02`

## Variáveis Better Auth

| Variável | Valor |
|---|---|
| `BETTER_AUTH_URL` | `https://homologacao.oraora.ia.br` |
| `NEXT_PUBLIC_APP_URL` | `https://homologacao.oraora.ia.br` |

## Passos

```bash
npx tsx scripts/prepare-homologation-alias.ts --check
npx tsx scripts/prepare-homologation-alias.ts --apply
```

Confirmar `get_project_domain.gitBranch === feature/prayer-validation-02`.  
Preservar Production. Sem merge na `main`. Sem LEGACY APPLY / SCRIPTURE APPLY sem autorização.
