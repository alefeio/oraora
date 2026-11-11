# PROD-0 — Lançamento institucional

Branch: `release/prod-0-institucional`  
Base: `main` @ `cf4ee681`

## Decisão arquitetural

A `main` declara `postinstall`/`build` com Prisma **sem** schema no repositório — causa de build quebrado.

Esta branch publica **apenas** a página institucional:

- sem Prisma, Better Auth, Postgres ou APIs de oração;
- sem cadastro, login, admin ou pagamentos;
- build: `next build` puro.

O MVP completo permanece nas branches `hardening/*` e no PR #1 (draft), **sem merge** neste gate.

## Aceite do proprietário (domínio oficial)

Antes de apontar Production/`oraora.ia.br` para este release:

1. Revisar Preview visual (desktop e mobile).
2. Confirmar logomarca, tipografia e textos oficiais.
3. Confirmar ausência de formulários/cadastro.
4. Confirmar SEO básico (título/descrição).
5. Autorizar explicitamente o deploy Production **desta** branch.

Não alterar DNS neste documento.
