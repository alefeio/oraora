# UI-05D — Jornada visual de intercessão

Branch: `feature/ui-05d-prayer-journey`  
Base: `feature/ui-05c-1-feed-refinements` @ `f3ac5ac`

## Superfícies

1. `/encontrar/[id]/orar` — composição editorial (história → intenção → Palavra opcional → oração → envio).
2. `/oracoes/[id]` — confirmação, status e próximos passos com elegibilidade real.

## Domínio preservado

- `SELF_PRAYER_FORBIDDEN` e bloqueio visual UI-05C.1.
- Idempotência de `submitPrayer` (mesma chave em retentativa; texto preservado em falha).
- Autorização via `getPrayerReadAccess` (intercessor / beneficiário aceito / admin; banidos bloqueados).
- Ranking, reciprocidade, bootstrap e categorias intactos.

## Achado (sem mudança silenciosa de política)

`submitPrayer` atual **aceita** pedidos `paused` e rejeita `closed`/`removed`.  
A UI espelha isso em `getPrayerSubmissionAvailability`.

## Admin / elegibilidade

Validação administrativa e concessão pós-aceitação: **PENDING** sem ADMIN no Preview.  
`/admin/revisao` fora deste gate.
