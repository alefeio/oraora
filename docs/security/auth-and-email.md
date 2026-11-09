# Autenticação e e-mail — Sprint F

## Biblioteca

Better Auth + adapter Prisma (`@better-auth/prisma-adapter`), alinhado ao Kale e aos padrões de sessão/verificação do Alexandre Feio.

## Fluxos locais

- Cadastro público (`disableSignUp` **não** é usado).
- Login / logout com sessão em cookie httpOnly.
- Papel `USER` por padrão; `ADMIN` preparado no campo `role` (não aceito pelo cliente no cadastro).
- Rate limit habilitado.
- Verificação de e-mail e recuperação de senha: hooks implementados.

## Provedor de e-mail

Sem Resend/API key nesta sprint (sem serviço pago).

Comportamento:

- Se `AUTH_EMAIL_MODE=console` (padrão em desenvolvimento): o link é registrado em log redigido e, opcionalmente, em arquivo local ignorado pelo Git (`tmp/auth-emails.log` via `AUTH_EMAIL_LOG_PATH`).
- Se `RESEND_API_KEY` + `AUTH_EMAIL_FROM` estiverem definidos e `AUTH_EMAIL_MODE=resend`: envio real (estrutura pronta; **não configurado** nesta sprint).
- `AUTH_REQUIRE_EMAIL_VERIFICATION` controla exigência. Em desenvolvimento local pode ser `false` para desbloquear testes sem caixa de entrada.

## Declaração explícita

A autenticação **não** está pronta para uso público. Falta provedor de e-mail de produção, secrets rotacionados, domínio verificado e política de verificação obrigatória ativa.

## Secrets

Nenhuma chave de Kale, Alexandre Feio ou do legado 2023 é reutilizada. Secrets locais ficam só em `.env.local` (fora do Git).
