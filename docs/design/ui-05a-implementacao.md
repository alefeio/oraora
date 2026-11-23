# UI-05A — Fundação visual controlada

Branch: `feature/ui-05a-visual-foundation`  
Base funcional: `hardening/gate-2-6d-account-recovery` @ `dca1d1e435c53472231c2a493a84b1dd42b4d8a7`  
Referência visual: `design/ui-redesign-discovery` @ `1420b24e5ee80e0a5a56abfb3d96e011459c8345`

Somente apresentação. Sem merge da branch de design. Sem alterações de regras, API, banco, auth ou rotas.

## Escopo aplicado

| Superfície | Status |
|---|---|
| Tokens globais (UI-03) | Aplicado em `src/app/globals.css` |
| Tipografia Nunito/Inter | Mantida via `layout.tsx`; hierarquia editorial na home |
| Botões / links / campos | Alvos ≥44px; disabled AA; `border-control` em campos |
| Cabeçalho | Logo ~40px; Encontrar visível no mobile; estados `aria-current` |
| Rodapé | Nome tipográfico + tagline; sem PNG repetido; textos preservados |
| Homepage | Composição UI-04 (essência como H1, caminho 01–03, faixa final) |

Fora de escopo (UI-05B+): auth, pedidos, intercessão, conta, admin — apenas impactos indiretos de chrome/tokens.

## Autenticação / Preview

PR #3 (`Invalid origin` / `trustedOrigins`) **não** foi incorporado.

A base funcional ainda resolve origens via `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` e `VERCEL_URL` em `src/lib/auth/auth.ts`. Aliases de branch Preview podem falhar em login se a origem do navegador não estiver na lista — **não** se enfraquece Better Auth para testes visuais. Homologação visual da homepage pública não depende de sessão.

## Matriz de regressão

| Rota | Antes | Depois | Compartilhado | Funcional preservado |
|---|---|---|---|---|
| `/` | Hero com logo grande + tagline H1 + 3 cards | Essência H1 + caminho numerado + banda | Header/Footer/tokens | CTAs `/encontrar` e `/signup`; textos de essência/princípio/passos |
| Header (todas) | Logo maior; Encontrar oculto no mobile público | Compacto; Encontrar sempre visível | — | Mesmos hrefs |
| Footer (todas) | PNG + essência/princípio/aviso | Tipografia + tagline + mesmos textos | — | Copy normativa |
| Auth / app | Tokens muted antigos; campos com borda fraca | Tokens AA (`#534A66`) + `border-control` nos campos; auth shell sem SiteHeader | Indireto (tokens/botões/campos) | Campos, fluxos, destinos intactos |
| `/encontrar` sem sessão | Redirect para login | Mesmo redirect | — | Comportamento de auth preservado (captura = login) |

## Verificações

| Check | Resultado |
|---|---|
| Lint | PASS |
| Typecheck | PASS |
| Build | PASS (retry após nudge de segurança Next.js) |
| Unit (sem DB) | 53 PASS / 2 skipped (`http-authz`) |
| DB tests | NÃO EXECUTADOS (não registrar como PASS) |
| Overflow homepage 320–1440 | PASS (`scrollWidth <= clientWidth`) |
| Foco visível CTAs | PASS |

Responsividade: `node scripts/check-ui-foundation-responsive.mjs` (app em `:3000`).  
Evidências reais Next.js: `docs/design/evidence/ui-05a/`.

## Asserção `chipsScrollOnly`

No script de protótipo UI-04R.1 a expressão era tautológica (`scroll > client || scroll <= client`). Neste gate a verificação efetiva é o overflow do **documento** na homepage Next.js (`scrollWidth <= clientWidth + 1`). Correção do script de referência na branch de design fica documentada para follow-up, sem alterar lógica de filtros do produto.
