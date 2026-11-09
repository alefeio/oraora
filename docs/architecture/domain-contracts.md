# Contratos de domínio

Regras de produto protegidas no código de domínio. Itens financeiros e de acompanhamento permanecem futuros.

## Sprint 2 — implementados

1. Cada novo pedido exige uma oração válida anterior (`RequestEligibility` open).
2. A autorização para pedir não acumula: no máximo uma elegibilidade `open` por usuário (índice parcial).
3. Oração exige conteúdo individualizado; “orei”/“amém” não liberam reciprocidade automaticamente.
4. O usuário não pode orar pelo próprio pedido.
5. Aprovação tardia de orações anteriores a uma publicação consumida não reabre elegibilidade.
6. Criação de pedido e consumo da elegibilidade ocorrem na mesma transação, com `FOR UPDATE`.
7. Contagem `validPrayerCount` do feed é reconstruível a partir de `PrayerValidation.effects.feedCount`.

## Ainda futuros (Sprint 3+)

- Toda interação patrocinada elegível precisa possuir orçamento real que sustente o crédito.
- O beneficiário recebe o crédito da campanha, não uma transferência direta do intercessor.
- Doações via Pix são diferentes de ajuda patrocinada.
- Quem doa passa a ser elegível para receber doações, sem limite proporcional ao valor doado.
- Avaliações e características positivas ajudam a construir identidade de cuidado.
- Não haverá ranking espiritual.
- Atualizações de pedidos não consomem nova autorização de reciprocidade.
- Acompanhamento faz parte da experiência central.
- Operações com dinheiro exigem transações, idempotência e auditoria.

## Diretriz financeira

Saldo **não** será um campo mutável em `User`. O domínio financeiro futuro usará um **ledger auditável** (partidas dobradas / razão de lançamentos), com idempotência e trilha de auditoria.
