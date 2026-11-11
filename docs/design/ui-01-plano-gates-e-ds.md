# UI-01 — Plano dos próximos gates e Design System (rascunho)

Bloqueado até aprovação da direção visual.

## Gates

| Gate | Entrega | Critério de saída |
|---|---|---|
| **UI-01** | Auditoria + 3 direções + recomendação | Este conjunto de docs |
| **UI-02** | Direção definitiva aprovada + moodboard/tokens-alvo | Decisão escrita do proprietário |
| **UI-03** | Design System (tokens, tipografia, componentes, a11y) | Spec aprovada; ainda sem código de produto |
| **UI-04** | Layouts das telas existentes (só apresentação) | Aceite visual por tela |
| **UI-05** | Implementação React/Tailwind na branch de design | Diff essencialmente visual; regressão funcional verde |
| **UI-06** | Homologação mobile/desktop/a11y + matriz de regressão | PASS para merge futuro (sem Production automático) |

## Plano do Design System (UI-03 — não implementar agora)

### Tokens
- Brand: primary, gold, coral, sage, cream (inalteráveis em HEX oficial).
- Semânticos: text/surface/border/focus/success/warning/danger.
- Ajustar `text-muted` para ≥4,5:1 sobre cream/branco.
- Proibir acentos como texto; criar `accent-surface-*`.

### Tipografia
- Nunito display + Inter body.
- Escala: display / title / body / meta / label.
- Regras de line-length (ideal 60–72ch em leitura).

### Espaço e grid
- Escala 4/8.
- Container app `max-w-3xl` leitura; marketing `max-w-6xl`.
- Gutters mobile 16–20; desktop 24–32.

### Forma
- Radius sm/md/lg alinhados.
- Sombra: 0–1 nível suave; preferir superfície a elevação.
- Bordas hairline quando necessárias.

### Componentes (visual only)
Button, Link, Field, Card (uso restrito), Badge, Empty, Skeleton, Header, Footer, AuthShell, Banner de status, Chip de filtro.

### Estados
default / hover / focus-visible / active / disabled / loading / error / success / empty.

### Iconografia
Linha fina alinhada ao MiniGuia; **sem** clichês religiosos; logo oficial intacto.

### A11y
WCAG 2.2 AA; foco visível; alvos ≥44px; status não só por cor.

### Marca
Regras de clear-space do logo; quando usar símbolo vs wordmark; proibição de recolorir o PNG.

## Planejamento por tela (UI-04 — esqueleto)

Para cada tela existente, o UI-04 documentará:

1. Estrutura funcional preservada  
2. Elementos visuais atuais  
3. Problemas (desta auditoria)  
4. Solução visual proposta  
5. Componentes  
6. Comportamentos imutáveis  
7. Aceite visual  
8. Regressão funcional  
9. Validação mobile/desktop  

Telas na fila (ordem sugerida):

1. Institutional `/` (PROD-0)  
2. Homepage pública `/`  
3. Auth shell + login/signup/recuperação/verificação  
4. Header/Footer  
5. Feed `/encontrar`  
6. Detalhe + Orar  
7. Pedir (elegível / bloqueado)  
8. Status `/oracoes/[id]`  
9. Conta  
10. Admin (densidade operacional)

## Controles Git (inalterados neste gate)

- Branch: `design/ui-redesign-discovery`
- Sem merge em `main`
- Sem tocar PR #1 / PR #2
- Sem migrations / seeds / Production deploy
