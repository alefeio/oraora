# UI-05C.1 — Auto-oração e filtros dinâmicos

Branch: `feature/ui-05c-1-feed-refinements`  
Base: `feature/boot-01-inaugural-request` @ `a99ad76`

## Escopo

1. **Auto-oração (UX):** marcador “Seu pedido”; sem botão/formulário de oração para o autor; API `SELF_PRAYER_FORBIDDEN` preservada.
2. **Filtros:** chips em `/encontrar` só para categorias com pedidos na fila principal (mesmos critérios do ranking).

## Privacidade

- `viewerIsAuthor` é calculado no servidor comparando `session.user.id` com `authorId`.
- `authorId` / e-mail / identidade civil **não** entram no DTO público.

## Filtros

- Fonte: `listFeedWithFilterCategories` → `categoriesFromPrimaryFeed(requests)`.
- `?category=` inválida ou sem pedidos → feed geral, sem erro.
- Fila vazia → empty state, **sem** chips.
- `/pedir` continua com `listActiveCategories()` (11 oficiais).

## Não alterado

Ranking, reciprocidade, bootstrap, schema, migrations, Issues #7/#8.
