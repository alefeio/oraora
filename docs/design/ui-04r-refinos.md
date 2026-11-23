# UI-04R — Refinamentos visuais

Branch: `design/ui-redesign-discovery`  
Base: `dd9eda5`  
Galeria: [explorations/ui-04/index.html](explorations/ui-04/index.html)  
Comparativo dos refinamentos: [explorations/ui-04/refinos.html](explorations/ui-04/refinos.html)

Somente protótipos isolados. Aplicação funcional inalterada.

## Ajustes feitos

| Prioridade | Tema | Alteração visual | Preservado |
|---|---|---|---|
| P0 | Login / auth | Painel único contínuo; logo + título + formulário na primeira visão; espaçamento interno do card | Campos, links, mensagens, destinos |
| P1 | Pedir bloqueado | Título → elegibilidade (corpo) → princípio (citação) → CTA; sem dois títulos em disputa | Textos de elegibilidade e princípio |
| P1 | Encontrar mobile | Chips em uma linha com rolagem horizontal; wrap no desktop | 11 categorias + Todas, labels, destinos |
| P1 | Cabeçalho | Logo ~40px, altura do topbar reduzida, alinhamento | Destinos de navegação |
| P1 | Rodapé | Nome tipográfico no lugar do PNG repetido; densidade menor | Tagline, essência, princípio, disclaimer |

## Larguras conferidas

320, 360, 390, 768, 1280 e 1440 (login e encontrar). Evidências em `evidence/ui-04/refinos/`.

## Matriz de regressão visual → funcional

| Área | Pode mudar | Não pode mudar | Status |
|---|---|---|---|
| Auth | Composição, espaçamento | Campos, minLength, links, copy de erro | Sem mudança funcional |
| Pedir bloqueado | Hierarquia tipográfica | Mensagens de elegibilidade, princípio, CTA `/encontrar` | Sem mudança funcional |
| Encontrar | Apresentação dos chips | Categorias, query, empty state | Sem mudança funcional |
| Header/Footer | Tamanho da marca, densidade | Hrefs e textos obrigatórios | Sem mudança funcional |
| Demais telas | Herdam chrome/auth refinados | Rotas, campos, regras | Revisadas na galeria |

## UI-04R.1 (follow-up P0/P1)

Overflow horizontal do documento em Encontrar mobile corrigido; alvos de toque dos chips restaurados a ≥44 px. Detalhes e medidas: [ui-04r1-overflow.md](./ui-04r1-overflow.md).

## Limites

Protótipos estáticos não comprovam leitor de tela nem acessibilidade integral no app. UI-04R.1 inclui checagem Playwright de overflow, foco e Tab nos chips.
