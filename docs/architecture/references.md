# Repositórios consultados (sem fork)

## kale (https://github.com/alefeio/kale)

Reaproveitado seletivamente:

- Prisma 7 + `prisma.config.ts` com URL direta
- `@prisma/adapter-pg` + pool `pg` + `attachDatabasePool`
- Better Auth + Prisma adapter + rota `api/auth/[...all]`
- Separação runtime pooled vs direct
- Guards de escrita em banco local
- `src/proxy.ts` para proteção leve de rotas

**Não copiado:** `disableSignUp: true` (este produto exige cadastro público).

## lp-alexandrefeio (https://github.com/alefeio/lp-alexandrefeio)

Reaproveitado seletivamente:

- Verificação de e-mail e reset de senha via hooks Better Auth
- Política de roles (`USER`/`ADMIN`, role não aceita do cliente)
- Cookies/sessão e rate limit
- Isolamento de URLs de banco (runtime vs migration)
- Ideia de idempotência por escopo/chave (versão enxuta nesta fundação)

**Não copiado:** cursos, anúncios, comércio, IA, Resend keys.

## orapormim legado (https://github.com/alefeio/orapormim)

Referência histórica (Express/TypeORM/JWT).

Estudado apenas como contexto de casos de uso antigos (pedido, categorias, bíblia).

**Não copiado:** JWT, credenciais, tokens, migrations TypeORM, modelo antigo de oração.
