# UI-05C — Redesign visual da área autenticada

Branch: `feature/ui-05c-authenticated-surfaces`  
Base: `feature/ui-05b-auth-visual` @ `42f228fa9f46ad1c457e37aeb760ab2a2eb944d5`  
Referência visual: `design/ui-redesign-discovery` @ `1420b24e5ee80e0a5a56abfb3d96e011459c8345` (sem merge)

Somente apresentação. Sem alteração de regras, APIs, Prisma, banco, ranking ou autenticação.

## Escopo aplicado

| Superfície | Rota | Status |
|---|---|---|
| Encontrar | `/encontrar` | Hierarquia editorial; chips ≥44 px com scroll só no rail; empty sálvia; cards só com pedidos |
| Detalhe | `/encontrar/[id]` | História principal; intenção em superfície distinta; CTA; layout 2 colunas no desktop |
| Minha Conta | `/account` | Nome em destaque; e-mail secundário; papel/verificação; ações agrupadas |
| Pedir bloqueado | `/pedir` | Título → elegibilidade → princípio (citação) → CTA Encontrar |
| Pedir elegível | `/pedir` | Aviso de consumo + formulário em superfície única |

## Preservado

- Ranking (`feed-ranking.ts` / `queries.ts`) intactos
- Categorias, filtros `?category=`, destinos de CTA
- Reciprocidade e `eligibility.message` reais
- Campos e validações de `CreateRequestForm`
- `AUTH_PATHS.postLogin = /encontrar` (UI-05B)
- Header/footer homologados
- Issues #7/#8 (busca / IA) não iniciadas

## Validação automatizada

| Check | Resultado |
|---|---|
| Lint | PASS |
| Typecheck | PASS |
| Build | PASS |
| Unitários | 57 PASS / 14 skipped |
| DB tests | SKIPPED |
| Ranking unit | PASS (`feed-ranking.test.ts`) |
| postLogin `/encontrar` | PASS (código UI-05B intacto) |

## Evidências

Pasta: `docs/design/evidence/ui-05c/`  
Capturas autenticadas reais no Preview dependem de sessão do proprietário (SSO Vercel ativo). Matriz: `regression-matrix.md`.

## Preview / PR

- Base do PR: `feature/ui-05b-auth-visual`
- Alias esperado: https://oraora-git-feature-ui-05c-authenticated-surfaces-alefeios-projects.vercel.app
- HEAD: `ddbc4df72f073b6f1554d4a22e2f6734d9d5c541`
- SSO Vercel ativo; sem Production; sem merge main
- Homologação autenticada real pendente do proprietário
