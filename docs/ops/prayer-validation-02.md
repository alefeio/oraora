# PRAYER-VALIDATION-02 — Validação automática e moderação por exceção

## Princípio

O Ora Ora não julga orações. Protege pessoas e garante reciprocidade legítima.

## Política V2

- Módulo: `src/modules/intercession/validation-policy-v2.ts`
- Versão: `VALIDATION_POLICY_VERSION = 2`
- Sem IA e sem serviços externos de análise de texto
- Resultados: `accepted` | `manual_review` | `rejected` | bloqueio pré-envio (`PRAYER_BODY_*`)

### Limites configuráveis (não dogma)

`ABUSE_RATE_LIMITS` documenta janela e limiares soft/hard de frequência e duplicata.
Um sinal isolado de baixa confiança **não** rejeita automaticamente.

## Fluxo atômico

`submitPrayer` classifica → cria registro → `applyValidationDecision` na mesma TX.
Admin e reprocessamento legado compartilham `applyValidationDecision`.
`decidedByUserId` permanece `null` para decisões de sistema (sem ADMIN fictício).

## Fila de exceções

`/admin/revisao` lista `manual_review` e legados `pending`.

## Reprocessamento legado (único)

```bash
npm run prayer:reprocess-legacy -- --env=local --prayerId=<id>
npm run prayer:reprocess-legacy -- --env=preview --prayerId=<id> --apply --confirm=OWNER_AUTHORIZED
```

Dry-run por padrão. Apply exige autorização explícita do proprietário.
Não executar em massa. Não alterar Production.
