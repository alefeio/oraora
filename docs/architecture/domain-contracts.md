# Contratos de domínio (ainda não implementados)

Estes contratos são regras de produto que o código de domínio deverá proteger em sprints futuras.  
**Sprint F:** apenas documentação. Nenhuma entidade financeira completa ou fluxo de oração é implementado aqui.

1. Cada novo pedido exige uma oração válida anterior.
2. A autorização para pedir não poderá ser acumulada indefinidamente.
3. Oração exige conteúdo individualizado.
4. O usuário não pode orar pelo próprio pedido.
5. Toda interação patrocinada elegível precisa possuir orçamento real que sustente o crédito.
6. O beneficiário recebe o crédito da campanha, não uma transferência direta do intercessor.
7. Doações via Pix são diferentes de ajuda patrocinada.
8. Quem doa passa a ser elegível para receber doações, sem limite proporcional ao valor doado.
9. Avaliações e características positivas ajudam a construir identidade de cuidado.
10. Não haverá ranking espiritual.
11. Pedidos com menos orações recebem maior prioridade no feed, respeitando limites temporais.
12. Privacidade de identidade e visibilidade do conteúdo são controles diferentes.
13. Atualizações de pedidos não consomem nova autorização de reciprocidade.
14. Acompanhamento faz parte da experiência central.
15. Operações com dinheiro exigem transações, idempotência e auditoria.

## Diretriz financeira

Saldo **não** será um campo mutável em `User`. O domínio financeiro futuro usará um **ledger auditável** (partidas dobradas / razão de lançamentos), com idempotência e trilha de auditoria.
