# UI-03 — Matriz de regressão funcional (preparação)

Usar em UI-05/UI-06. O UI-03 **não implementa** mudanças.

| Área | Deve permanecer | Pode mudar (só visual) | Evidência |
|---|---|---|---|
| Rotas | Paths e redirects | Layout interno | Código rotas |
| Auth | Campos, minLength, mensagens, verify/reset | AuthShell, spacing, cores | Forms auth |
| Sessão/permisões | requireUser, roles | Aparência header/conta | session/policy |
| Reciprocidade | canPublish, consumo, textos | Apresentação do bloqueio | pedir/page |
| Feed | Ordenação, filtros category | Card vs lista, chips | encontrar |
| Detalhe/Orar | Conteúdo, CTA, compose fields, API | Tipografia, card | orar/forms |
| Status oração | Outcomes e banners textuais | Badge styling | oracoes/[id] |
| Admin | Validation actions | Densidade visual | admin |
| APIs/DB | Contratos, schema | Nenhum | — |
| Financeiro | Ausente | Não antecipar UI financeira | — |

## Critérios de falha de regressão

- Botão sem ação / rota quebrada  
- Campo obrigatório removido  
- Validação omitida  
- Elegibilidade contornada visualmente  
- Destino de nav novo ou removido  
- Dado sensível exposto  

## Telas ainda não homologadas visualmente ao vivo

Ver `ui-02-pendencias-captura.md` / checklist UI-03.  
**Layouts finais (UI-04) dessas telas ficam bloqueados** até capturas do proprietário.
