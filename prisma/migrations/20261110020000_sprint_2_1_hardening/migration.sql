-- Idempotência passa a ser isolada por usuário e payload.
DROP INDEX IF EXISTS "idempotency_record_scope_key_key";
CREATE UNIQUE INDEX "idempotency_record_scope_user_key_unique"
ON "idempotency_record" ("scope", COALESCE("userId", ''), "key");

-- Pedidos já consumidos podem exigir revisão/compensação após invalidação.
ALTER TABLE "prayer_request"
ADD COLUMN "moderationPending" BOOLEAN NOT NULL DEFAULT false;

-- Histórico append-only de invalidações e demais revisões explícitas.
CREATE TABLE "prayer_validation_revision" (
    "id" TEXT NOT NULL,
    "validationId" TEXT NOT NULL,
    "prayerId" TEXT NOT NULL,
    "previousOutcome" TEXT NOT NULL,
    "newOutcome" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "previousEffects" JSONB NOT NULL,
    "newEffects" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prayer_validation_revision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prayer_validation_revision_validationId_createdAt_idx"
ON "prayer_validation_revision" ("validationId", "createdAt");

CREATE INDEX "prayer_validation_revision_prayerId_createdAt_idx"
ON "prayer_validation_revision" ("prayerId", "createdAt");

ALTER TABLE "prayer_validation_revision"
ADD CONSTRAINT "prayer_validation_revision_validationId_fkey"
FOREIGN KEY ("validationId") REFERENCES "prayer_validation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prayer_validation_revision"
ADD CONSTRAINT "prayer_validation_revision_prayerId_fkey"
FOREIGN KEY ("prayerId") REFERENCES "prayer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prayer_validation_revision"
ADD CONSTRAINT "prayer_validation_revision_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "user"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
