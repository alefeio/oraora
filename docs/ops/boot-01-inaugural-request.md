# BOOT-01 — Inicialização da primeira corrente de oração

Branch: `feature/boot-01-inaugural-request`  
Base: `feature/ui-05c-authenticated-surfaces`

## Problema

Sem pedidos na fila, ninguém pode orar; sem oração validada, ninguém pode publicar. A reciprocidade permanente está correta — falta um bootstrap inaugural **único e auditável**.

## Mecanismo

Usa `RequestEligibility.sourceType = "admin_grant"` já previsto no schema (sem migration).

1. Inspeção read-only: `npx tsx scripts/inspect-preview-bootstrap.ts`
2. Dry-run (padrão): `npx tsx scripts/bootstrap-inaugural-grant.ts --env=local --founder=<userId>`
3. Apply **somente** com autorização do proprietário:  
   `npx tsx scripts/bootstrap-inaugural-grant.ts --env=preview --founder=<userId> --confirm=OWNER_AUTHORIZED`  
   (Preview remoto exige também `ALLOW_REMOTE_DB_WRITE=true`)
4. Conta fundadora cria o pedido pela UI `/pedir` (fluxo normal). Título sugerido: *Orem pelo início desta comunidade*.

### Condições

- Não Production.
- `ownerAuthorized` explícito (`--confirm=OWNER_AUTHORIZED`).
- Comunidade ainda sem pedidos reais e sem audit de bootstrap.
- No máximo um `admin_grant` / open por fundadora; segunda chamada idempotente.
- Sem rota pública; sem crédito cumulativo.
- Evento de auditoria `bootstrap.inaugural_admin_grant`.

### O que este gate **não** faz automaticamente

- Não executa o grant no Preview.
- Não insere pedido direto na tabela.
- Não altera ranking do feed.
- Não inicia UI-05D.

## Proposta futura (não implementada) — fila principal vazia de novo

Quando pedidos saem da fila após ~7 dias (`leavePrimaryQueue` na política de idade), a comunidade pode ficar sem itens descobertos **mesmo com pedidos abertos**.

Opções seguras a avaliar em gate próprio (sem mudar o algoritmo atual agora):

1. **Descoberta do inaugural ativo:** superfície secundária “pedido de abertura da comunidade” se ainda `status=open` e fora da fila primária — sem reabrir encerrados.
2. **Arquivo de cuidado:** listagem opt-in de pedidos abertos fora da fila, com o mesmo controle de visibilidade/auth.
3. **Aviso de fila vazia** com CTA para orar por pedidos ainda abertos (link direto), sem fake feed.

Nenhuma dessas opções deve conceder novo `admin_grant` automaticamente.

## Pendência do proprietário

Autorizar explicitamente a execução do grant no banco Preview (conta fundadora + `--confirm=OWNER_AUTHORIZED`). Até lá: `PENDING DATABASE ACTION`.
