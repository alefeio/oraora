# UI-04R.1 — Correção de overflow mobile (Encontrar)

Branch: `design/ui-redesign-discovery`  
Galeria: [explorations/ui-04/index.html](explorations/ui-04/index.html)  
Comparativo: [explorations/ui-04/refinos.html](explorations/ui-04/refinos.html)  
Auditoria: [evidence/ui-04/refinos/overflow-audit.json](evidence/ui-04/refinos/overflow-audit.json)

Somente protótipos isolados. Aplicação funcional inalterada.

## Causa raiz

A faixa de categorias (`.chips` com `flex-wrap: nowrap`) expandia a largura intrínseca do ancestral em CSS Grid/Flex. Com `min-width: auto` (padrão), `scrollWidth` do documento ultrapassava o viewport (~1131–1148 px em 320–768). Não era necessário mascarar com `overflow-x: hidden` em `html`/`body`.

## Correção

| Item | Mudança |
|---|---|
| P0 | Cadeia `min-width: 0` / `max-width: 100%` em `.wrap`, `.page`, `.main`, `.account`/filhos, `.feed-filters` e `.chips`; rolagem horizontal só em `.chips` |
| P1 | Removida redução `min-height: 38px` em `@media (max-width: 360px)`; chips permanecem com `min-height`/`min-width: 44px` |

Categorias, labels, destinos e lógica de filtros inalterados.

## Critério P0 (Playwright)

`document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`

O container `.chips` pode ter `scrollWidth > clientWidth` (rolagem intencional).

## Medidas Encontrar (estado vazio)

| Viewport | clientWidth | scrollWidth | chips client | chips scroll | chip min-height | overflow |
|---|---:|---:|---:|---:|---:|---|
| 320 | 320 | 320 | 280 | 1111 | 44 | PASS |
| 360 | 360 | 360 | 320 | 1111 | 44 | PASS |
| 390 | 390 | 390 | 350 | 1128 | 44 | PASS |
| 768 | 768 | 768 | 728 | 1128 | 44 | PASS |
| 1280 | 1280 | 1280 | 1080 | 1080 | 44 | PASS |
| 1440 | 1440 | 1440 | 1080 | 1080 | 44 | PASS |

36 combinações tela×viewport auditadas; 0 falhas de overflow no documento. Home, account, login e pedir-bloqueado sem overflow semelhante.

## Teclado / foco

Primeira e última categoria focáveis; última fica visível após `scrollIntoView`; outline/`:focus-visible` presente; Tab avança entre chips sem armadilha.

## Evidências

- `evidence/ui-04/refinos/encontrar-fix-320.png` (+ `-viewport`)
- `evidence/ui-04/refinos/encontrar-fix-360.png` (+ `-viewport`)
- `evidence/ui-04/refinos/encontrar-fix-390.png` (+ `-viewport`)
- `evidence/ui-04/refinos/overflow-antes-encontrar-390.png`
- `evidence/ui-04/refinos/depois-encontrar-mobile.png` (pós-correção)
- `evidence/ui-04/refinos/overflow-audit.json`

Reproduzir:

```powershell
node docs\design\_serve-ui04.js
# outro terminal:
node docs\design\explorations\ui-04\_audit-overflow.mjs
```

(Requer Playwright em `docs/design/explorations/ui-04/` via `npm install` local; `node_modules` não versionado.)
