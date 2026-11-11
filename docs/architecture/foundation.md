# Fundação técnica — Sprint F

## Monólito modular

Next.js (App Router) hospeda UI e HTTP. Regras de negócio ficam em `src/modules/*` e `src/lib/*`, não em componentes React.

```text
src/
  app/                 # rotas UI e HTTP
  modules/             # domínios (contratos e futuros casos de uso)
  lib/                 # infra compartilhada (db, auth, security, api)
prisma/                # schema e migrations
docs/                  # produto, arquitetura, segurança
tests/                 # testes unitários e de integração leve
```

## API mobile-ready

Operações de domínio expostas em `/api/v1/*` com validação Zod no servidor.  
Server Actions não são o único canal. Clientes mobile futuros reutilizarão os mesmos handlers HTTP. Autenticação mobile (Bearer/token) fica prevista, sem implementação nesta sprint: a web usa sessão cookie via Better Auth.

## Eventos / outbox

Tabela `OutboxMessage` existe para desacoplar oração ↔ reciprocidade ↔ patrocínio ↔ dinheiro **no futuro**.  
Não há worker contínuo em memória (incompatível com o modelo serverless da Vercel). Processamento será sob demanda / job externo em sprint posterior.

## Políticas versionadas

`PolicyDocument` guarda JSON versionado (`feed`, `validation`, `financial`, `safety`, `product`). Hipóteses de produto (72h, 7 dias, valores) entram como documentos, não como constantes espalhadas.

## Ambientes de banco

- Local: Docker Compose (`orapormim_dev`), isolado de Kale/Alexandre Feio/legado.
- Futuro Vercel: `DATABASE_URL` / `RUNTIME_DATABASE_URL` pooled para runtime; `DIRECT_URL` / `POSTGRES_URL` para migrations.
- Produção separada; nenhum banco compartilhado com outros projetos.
