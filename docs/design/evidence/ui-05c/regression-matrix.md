# UI-05C — Matriz de regressão

| Check | Esperado | Status |
|---|---|---|
| Login → `/encontrar` | AUTH_PATHS.postLogin | PASS (código UI-05B intacto) |
| Ranking do feed | `feed-ranking.ts` sem diff | PASS |
| Filtros `?category=` | Mesmos hrefs/chips | PASS (apresentação) |
| Pedidos privados | Sem mudança de queries | PASS |
| CTA orar | `/encontrar/[id]/orar` | PASS |
| Reciprocidade | `eligibility.message` real | PASS |
| Bloqueado não publica | `canPublish` inalterado | PASS |
| Conta: 3 ações | Encontrar, Pedir, Sair | PASS |
| Admin / APIs / DB | Fora de escopo | NÃO ALTERADO |
| DB tests | — | SKIPPED |
| Sessão real Preview | Homologação do proprietário | PENDING |
