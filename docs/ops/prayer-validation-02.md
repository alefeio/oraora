# PRAYER-VALIDATION-02 / 02R — Validação automática e moderação por exceção

## Princípio

O Ora Ora não julga orações. Protege pessoas e garante reciprocidade legítima.

## Política V2 (+ hardening 02R)

- Módulo: `src/modules/intercession/validation-policy-v2.ts`
- Versão: `VALIDATION_POLICY_VERSION = 2`
- Sem IA e sem serviços externos de análise de texto
- Resultados: `accepted` | `manual_review` | `rejected` | bloqueio pré-envio (`PRAYER_BODY_*`)

### O que a classificação faz

- Bloqueia vazio, trivial e conteúdo evidentemente sem significado
- Encaminha ameaça/assédio objetivos e combinações de spam à moderação
- Rejeita anúncio inequívoco (URLs + promo)
- Aceita orações curtas e significativas **sem exigir** vocabulário religioso

### Limitações (cobertura incompleta)

- Não detecta todas as formas de abuso, ironia, dog-whistles ou ofensas codificadas
- Não avalia sinceridade, fé, denominação, gramática ou escolaridade
- Relatos legítimos de sofrimento/violência familiar **não** são tratados como ofensa
- Limites de frequência/duplicata são pontos de partida operacionais, não dogma
- Casos ambíguos permanecem em `manual_review` para humanos

## Concorrência

`submitPrayer` trava o intercessor (`lockIntercessorUser`) antes de contar frequência/duplicata
e aplicar a decisão. Ordem canônica de locks: **usuário → pedido**.
Após conflito de unicidade (P2002), a recuperação ocorre **fora** da TX abortada.

## Fluxo atômico

`submitPrayer` classifica (com contagens na TX) → cria registro → `applyValidationDecision`.
Admin e reprocessamento legado compartilham o mesmo motor.
`decidedByUserId` permanece `null` para decisões de sistema.

## Fila de exceções

`/admin/revisao` lista `manual_review` e legados `pending`.

## Orações recebidas

`/account/oracoes-recebidas` — somente `accepted` do beneficiário autenticado,
via `getPrayerReadAccess`. Sem dados privados do intercessor.

## Reprocessamento legado (único)

```bash
npm run prayer:reprocess-legacy -- --env=local --prayerId=<id>
npm run prayer:reprocess-legacy -- --env=preview --prayerId=<id>
```

- Usa `proveEffectivePrismaWriteTarget` (DATA-02) antes de qualquer apply
- `manual_review` da política V2 **não** é liberado automaticamente
- Decisões humanas (`decidedByUserId`) e efeitos já aplicados são preservados
- Apply no Preview: **bloqueado** no gate 02R

## Homologação

Domínio: `https://homologacao.oraora.ia.br`  
Após aprovação dos testes, vincular alias/`gitBranch` à branch do PR #14
(`feature/prayer-validation-02`). Preservar Production.
