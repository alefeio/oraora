# Sprint 3 — contratos financeiros

Este documento define fronteiras para a futura camada financeira. Ele não autoriza cobranças, anúncios ou movimentação de dinheiro no Sprint 2.1.

## PrayerSession e exposição

`PrayerSession` representa uma sessão autenticada de cuidado, vinculada a uma oração e a uma versão de política. A sessão registra início, conclusão, participante e evidências mínimas, sem copiar texto sensível para eventos financeiros.

Uma `Exposure` é uma impressão elegível de conteúdo patrocinado dentro de uma sessão. Sua identidade deve ser idempotente por sessão, posição e campanha. Exposição não equivale a cobrança: ela apenas produz um fato verificável para avaliação posterior.

## Reserva de orçamento

Antes de aceitar uma exposição faturável, o domínio de anúncios cria uma `BudgetReservation` atômica e com expiração. A reserva impede gasto acima do orçamento e possui os estados `reserved`, `captured`, `released` e `expired`.

Captura e liberação devem usar comparação de estado, chave idempotente e valor imutável. Nenhum processo deve calcular saldo apenas somando campos mutáveis de campanha.

## Ledger

O ledger é append-only e usa partidas balanceadas. Correções são novos lançamentos compensatórios; lançamentos anteriores nunca são editados ou excluídos. Cada entrada referencia a reserva, a exposição, a política e uma chave idempotente.

Valores usam unidade monetária inteira na menor denominação e código ISO de moeda. Saldos são projeções reconstruíveis do ledger, não fonte de verdade.

Invalidações de oração que já tenham produzido efeitos consumidos geram uma obrigação de compensação futura. No Sprint 2.1 isso aparece apenas como `moderationPending` e `financialCompensationRequired` no histórico de revisão.

## Outbox e Vercel

A transação que altera reserva ou ledger também grava uma mensagem na outbox. O publicador processa mensagens com entrega pelo menos uma vez; consumidores precisam ser idempotentes.

Em Vercel não se assume worker residente. O processamento será disparado por função agendada ou invocação controlada, em lotes curtos, com:

- seleção por `processedAt IS NULL` e bloqueio concorrente;
- limite de tentativas, backoff e registro de erro;
- marcação de processamento somente após sucesso;
- observabilidade por correlação, sem dados pessoais ou segredos;
- reconciliação periódica entre reservas, ledger e projeções.

Timeout ou repetição de função não pode duplicar captura, lançamento nem exposição.
