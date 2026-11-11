# UI-02 — Comparativo AB-1 × AB-2

Evidências: style tiles em `explorations/` + capturas em `evidence/ui-02/`.

## Matriz comparativa

| Critério | AB-1 Acolhimento | AB-2 Serenidade | Nota técnica |
|---|---|---|---|
| Acolhimento | **Alto** — soft panels, glow discreto, raios maiores | Médio — calor via tipografia/espaço, menos “abraço” visual | AB-1 comunica proximidade humana de imediato |
| Confiança | Alto — CTAs claros em superfície familiar | **Alto+** — menos ruído, leitura serena | Ambos usam primary AA; AB-2 reduz distração |
| Sofisticação | Médio-alto | **Alto** — editorial, hairlines, escala tipográfica | AB-2 evita “template soft SaaS” |
| Clareza de ações | **Alto** — botões e chips evidentes | Alto — depende de hierarquia tipográfica | AB-1 mais seguro para usuários iniciantes |
| Legibilidade | Alto com tokens AA (`#534A66` muted) | **Alto** — linha de leitura longa, contraste forte | Ambos corrigem muted/coral-como-texto do UI-01 |
| Personalidade de marca | Calor + comunidade | Contemplação + profundidade | Ambos preservam logo/paleta |
| Fit telas existentes | **Alto** — migração suave a partir dos Cards atuais | Médio-alto — exige desaprender cards na home/feed | AB-2 muda mais o “esqueleto” visual |
| Mobile/desktop | Confortável; chips touch-friendly | Excelente desktop; mobile precisa cuidado com H1 grandes | Testar reflow 320px em UI-06 |
| Reaproveitamento de componentes | **Alto** — Button/Field/Card evoluídos | Médio — Card restrito; novos padrões de lista/divider | AB-1 reaproveita mais o DS atual |

## Contextos

| Contexto | AB-1 | AB-2 |
|---|---|---|
| Institucional/pública | Soft panels Conhecer/Orar/Pedir; hero com glow | Hero tipográfico; seções por divisor |
| Autenticação | Card elevado acolhedor | Formulário aberto, quase sem caixa |
| Área restrita | Feed em cards suaves + chips pill | Feed em lista editorial + filtros underline |

## Recomendação de proporção visual

**Proporção sugerida: 60% AB-1 · 40% AB-2**

### Justificativa (composição, hierarquia, a11y — não só gosto)

1. **Composição:** o produto autenticado (feed, forms, estados) beneficia-se de superfícies suaves do AB-1 para agrupamento perceptível sem voltar ao “dashboard de cards” atual; o AB-2 entra para **eliminar cards decorativos** na home/institucional e nos momentos de leitura (história/oração).
2. **Hierarquia:** H1 expressivo e underline gold do AB-2 resolvem a concorrência logo×tagline do UI-01; CTAs e chips do AB-1 mantêm a descoberta de ações (problema da Direção A pura no V1.0: “excesso de suavidade pode enfraquecer hierarquia de ações”).
3. **Acessibilidade:** ambos usam texto AA; AB-1 oferece alvos e agrupamentos mais óbvios em mobile; AB-2 exige disciplina de foco/estados em listas hairline (mais fácil falhar sem DS).
4. **Compatibilidade:** 60/40 reduz risco de regressão visual abrupta e permite Design System único com variantes `density: soft | editorial`.

### Alternativas se o proprietário preferir polo puro

- **AB-1 dominante (80/20):** priorizar acolhimento imediato e onboarding.
- **AB-2 dominante (30/70):** priorizar sofisticação institucional; investir mais em UI-03 para listas/feed.

## O que não entra na escolha

- Mudança de reciprocidade, IA de navegação autenticada ou textos normativos do V1.0.
- Redesenho do símbolo.
- Novas rotas ou CTAs funcionais.
