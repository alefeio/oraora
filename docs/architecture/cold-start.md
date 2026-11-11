# Partida a frio — pedidos iniciais

## Sprint 1 (agora)

- Fixtures **sintéticas** claramente marcadas (`isSyntheticFixture`, título `[TESTE]`, `fixtureKey`).
- Só em host local / `DATABASE_ENV` descartável.
- Proibidas em produção.
- Não representam pessoas reais, doença, luto ou pobreza reais.

## Futuro (após Sprint 2+)

Entrada de pedidos reais de participantes fundadores deverá:

1. Obter consentimento explícito do participante.
2. Usar concessão administrativa **auditada** de elegibilidade de reciprocidade (exceção de partida a frio).
3. Registrar ator, motivo, correlação e validade da concessão em `audit_event`.
4. Consumir a elegibilidade na mesma transação da criação do pedido.
5. Nunca oferecer bypass silencioso nem flag de “desligar reciprocidade” em produção.

A Sprint 1 **não** implementa o fluxo administrativo de exceções, para evitar abuso prematuro.
