# UI-03 — Design System visual Ora Ora

**Branch:** `design/ui-redesign-discovery`  
**Direção:** AB-1 acolhimento (~60%) + AB-2 serenidade editorial (~40%)  
**Estado:** Pronto para revisão visual/técnica — **não implementado** em React/Tailwind  
**Produto:** funcionamento, regras e restrições **imutáveis**

## Documentos deste gate

| Arquivo | Conteúdo |
|---|---|
| [ui-03-tokens.md](./ui-03-tokens.md) | Foundations / tokens |
| [ui-03-componentes.md](./ui-03-componentes.md) | Specs por componente |
| [ui-03-aplicacao-contextual.md](./ui-03-aplicacao-contextual.md) | Institucional / auth / app / admin |
| [ui-03-acessibilidade.md](./ui-03-acessibilidade.md) | WCAG 2.2 AA + auditoria |
| [ui-03-regressao-funcional.md](./ui-03-regressao-funcional.md) | Matriz para UI-05/06 |
| [explorations/ds/showcase.html](./explorations/ds/showcase.html) | Demo visual isolada |
| [evidence/ui-03/](./evidence/ui-03/) | CSV contraste + capturas |

## Princípios

1. Marca oficial intacta (logo, paleta, Nunito/Inter).  
2. Acolhimento sem infantilizar; serenidade sem frialdade.  
3. Menos cards decorativos; mais hierarquia tipográfica.  
4. Acentos gold/coral/sage = superfície/luz — nunca texto.  
5. Um Design System para institucional + público + auth + app + admin (densidades diferentes).  
6. Pesquisa V1.0 só como referência visual ([references/ESCOPO-V1-PESQUISA.md](./references/ESCOPO-V1-PESQUISA.md)).

## Foundations (resumo)

- **Cor:** brand + text AA + surfaces soft (incl. coral/gold/sage soft).  
- **Tipo:** Nunito display / Inter UI; escala responsiva.  
- **Espaço:** 4/8; containers por contexto.  
- **Forma:** radius dual; sombra só AB-1.  
- **Foco:** ring primary.  
- **Motion:** mínima + reduced-motion.

## Componentes cobertos

Button, Link, Field*, Card/Soft/Divider, Badge, Banner, Empty, Skeleton, Header, Footer, AuthShell, Nav/Filtros, composições de pedido/intercessão, Admin.

## Correções UI-02 neste gate

- Coral removido como texto do kicker AB-1.  
- Auditoria de combinações em superfícies reais.  
- Disabled AA documentado com token alternativo.  
- Inventário de capturas autenticadas mantido **PENDING**.

## Fora de escopo (bloqueado)

- UI-04 layouts finais de telas sem captura  
- UI-05 implementação  
- Mudança de regras / rotas / APIs / DB  

## Critério de saída UI-03

Proprietário revisa DS + showcase e aprova para UI-04 **apenas** nas superfícies já evidenciadas; telas autenticadas pendentes seguem checklist de captura.
