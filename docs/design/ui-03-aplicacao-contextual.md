# UI-03 — Aplicação contextual (AB mix)

Proporção conceitual **~60% AB-1 / ~40% AB-2**. Não é métrica de pixels.

## Institucional (PROD-0 / marketing)

| Preferir AB-2 | Preferir AB-1 |
|---|---|
| Hero tipográfico, espaço negativo | Proximidade logo↔mensagem |
| Seções por ritmo/divisores | CTAs reconhecíveis |
| Poucos cards | Soft panels pontuais se necessário |

**Não:** novos CTAs funcionais, forms, métricas inventadas.

## Público funcional (home `/`)

- Hierarquia: logo → essência/princípio (evitar H1 = tagline do PNG).  
- Caminho Conhecer / Orar / Pedir: soft panels (AB-1) ou divisores (AB-2) — mesmo conteúdo.  
- Nav: todos os destinos atuais visíveis no mobile (incl. Encontrar).

## Autenticação

- Clareza de formulário **AB-1** (soft fields, card leve).  
- Simplicidade **AB-2** (sem decoração concorrente).  
- Estados disabled/erro/sucesso conforme tokens AA.

## Área autenticada (encontrar, detalhe, orar, pedir, orações, conta)

- Leitura de história: tipografia AB-2.  
- Lista/feed: AB-1 para agrupamento perceptível **ou** lista editorial AB-2 — escolher um padrão no UI-04 após capturas.  
- CTAs de orar/pedir: AB-1 (evidência de ação).  
- Bloqueio de elegibilidade: preservar texto normativo; só superfície/hierarquia.

## Administração

- Densidade e legibilidade atuais.  
- Sem glows, sem pills decorativos.  
- AB-2 operacional.

## Matriz rápida

| Contexto | AB-1 | AB-2 | Resultado |
|---|---:|---:|---|
| Institucional | 40 | 60 | Editorial acolhedor |
| Auth | 70 | 30 | Conforto + clareza |
| App logado | 60 | 40 | Contemplação + ação |
| Admin | 20 | 80 | Operacional |

Nenhuma célula autoriza mudar regras, rotas ou campos.
