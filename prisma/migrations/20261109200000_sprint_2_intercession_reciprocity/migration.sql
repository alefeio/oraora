-- CreateTable
CREATE TABLE "scripture_passage" (
    "id" TEXT NOT NULL,
    "referenceLabel" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "chapter" INTEGER,
    "verseStart" INTEGER,
    "verseEnd" INTEGER,
    "translationCode" TEXT,
    "licenseStatus" TEXT NOT NULL DEFAULT 'reference_only',
    "textBody" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scripture_passage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripture_topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scripture_topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripture_passage_topic" (
    "passageId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "scripture_passage_topic_pkey" PRIMARY KEY ("passageId","topicId")
);

-- CreateTable
CREATE TABLE "category_scripture_topic" (
    "categoryId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "category_scripture_topic_pkey" PRIMARY KEY ("categoryId","topicId")
);

-- CreateTable
CREATE TABLE "prayer" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "intercessorId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "medium" TEXT NOT NULL DEFAULT 'text',
    "body" TEXT NOT NULL,
    "scripturePassageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "contentHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_validation" (
    "id" TEXT NOT NULL,
    "prayerId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "effects" JSONB NOT NULL,
    "signals" JSONB,
    "rationale" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prayer_validation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_eligibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourcePrayerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "consumedByRequestId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,

    CONSTRAINT "request_eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scripture_passage_referenceLabel_translationCode_key" ON "scripture_passage"("referenceLabel", "translationCode");

-- CreateIndex
CREATE INDEX "scripture_passage_active_book_idx" ON "scripture_passage"("active", "book");

-- CreateIndex
CREATE UNIQUE INDEX "scripture_topic_slug_key" ON "scripture_topic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "prayer_intercessorId_idempotencyKey_key" ON "prayer"("intercessorId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "prayer_requestId_createdAt_idx" ON "prayer"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "prayer_intercessorId_createdAt_idx" ON "prayer"("intercessorId", "createdAt");

-- CreateIndex
CREATE INDEX "prayer_beneficiaryId_createdAt_idx" ON "prayer"("beneficiaryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "prayer_validation_prayerId_key" ON "prayer_validation"("prayerId");

-- CreateIndex
CREATE INDEX "prayer_validation_outcome_createdAt_idx" ON "prayer_validation"("outcome", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "request_eligibility_sourcePrayerId_key" ON "request_eligibility"("sourcePrayerId");

-- CreateIndex
CREATE UNIQUE INDEX "request_eligibility_consumedByRequestId_key" ON "request_eligibility"("consumedByRequestId");

-- CreateIndex
CREATE INDEX "request_eligibility_userId_status_idx" ON "request_eligibility"("userId", "status");

-- Invariante: no máximo uma elegibilidade aberta por usuário
CREATE UNIQUE INDEX "request_eligibility_one_open_per_user"
ON "request_eligibility"("userId")
WHERE "status" = 'open';

-- AddForeignKey
ALTER TABLE "scripture_passage_topic" ADD CONSTRAINT "scripture_passage_topic_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "scripture_passage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scripture_passage_topic" ADD CONSTRAINT "scripture_passage_topic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "scripture_topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_scripture_topic" ADD CONSTRAINT "category_scripture_topic_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "prayer_request_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_scripture_topic" ADD CONSTRAINT "category_scripture_topic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "scripture_topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer" ADD CONSTRAINT "prayer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "prayer_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer" ADD CONSTRAINT "prayer_intercessorId_fkey" FOREIGN KEY ("intercessorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer" ADD CONSTRAINT "prayer_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer" ADD CONSTRAINT "prayer_scripturePassageId_fkey" FOREIGN KEY ("scripturePassageId") REFERENCES "scripture_passage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_validation" ADD CONSTRAINT "prayer_validation_prayerId_fkey" FOREIGN KEY ("prayerId") REFERENCES "prayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_validation" ADD CONSTRAINT "prayer_validation_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_eligibility" ADD CONSTRAINT "request_eligibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_eligibility" ADD CONSTRAINT "request_eligibility_sourcePrayerId_fkey" FOREIGN KEY ("sourcePrayerId") REFERENCES "prayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_eligibility" ADD CONSTRAINT "request_eligibility_consumedByRequestId_fkey" FOREIGN KEY ("consumedByRequestId") REFERENCES "prayer_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;
