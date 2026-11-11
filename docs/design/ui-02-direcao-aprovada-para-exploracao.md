# UI-02 — Direção aprovada para exploração

## Decisão do proprietário

| Campo | Valor |
|---|---|
| Gate UI-01 | Aceito com condições |
| Direção autorizada | **Conceito A (Acolhimento contemporâneo) + disciplina do Conceito B (Elegância contemplativa)** |
| Tipo de aprovação | Exploração visual — **não** layouts finais, **não** implementação |
| Branch | `design/ui-redesign-discovery` |

## Interpretações exploradas

| ID | Nome | Ênfase |
|---|---|---|
| **AB-1** | Acolhimento predominante | Proximidade, superfícies suaves, tipografia acolhedora |
| **AB-2** | Serenidade predominante | Editorial, menos caixas, tipografia expressiva, vazio disciplinado |

Demonstrações estáticas:

- [explorations/ab-1/style-tile.html](./explorations/ab-1/style-tile.html)
- [explorations/ab-2/style-tile.html](./explorations/ab-2/style-tile.html)
- [explorations/compare.html](./explorations/compare.html)

## Referência de pesquisa

- Original no workspace: `docs/Ora_Ora_Estrategia_UX_UI_V1_2026-11-11.md`
- Cópia integral: [references/Ora_Ora_Estrategia_UX_UI_V1_2026-11-11.md](./references/Ora_Ora_Estrategia_UX_UI_V1_2026-11-11.md)
- Escopo: [references/ESCOPO-V1-PESQUISA.md](./references/ESCOPO-V1-PESQUISA.md)

O V1.0 reforça a combinação humanidade (A) + clareza (C no doc / B no UI-01) e confirma: acentos gold/coral/sage **não** como texto; Nunito + Inter; WCAG 2.2 AA.

## Invariantes (não negociáveis nesta exploração)

- Logo oficial sem redesenho
- Paleta oficial
- Rotas e navegação atuais
- Reciprocidade e elegibilidade atuais
- Campos e validações atuais
- Sem APIs / DB / auth / financeiro alterados

## Estados de aprovação

| Item | Estado |
|---|---|
| Direção A+B para exploração | **Aprovado** |
| Variação AB-1 | Em revisão visual |
| Variação AB-2 | Em revisão visual |
| Layouts finais | Não iniciados |
| Design System UI-03 | Bloqueado |
| Implementação React/Tailwind | Bloqueada |

## Próximo passo

Proprietário escolhe AB-1, AB-2 ou proporção híbrida (ver `ui-02-comparativo-ab.md`).  
Só então UI-03 (Design System definitivo).
