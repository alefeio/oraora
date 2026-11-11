-- CreateTable
CREATE TABLE "prayer_request_category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "safetyClass" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prayer_request_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_request" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "prayerNeed" TEXT NOT NULL,
    "publicIdentityMode" TEXT NOT NULL,
    "publicLabel" TEXT NOT NULL,
    "contentVisibility" TEXT NOT NULL DEFAULT 'authenticated',
    "status" TEXT NOT NULL DEFAULT 'open',
    "validPrayerCount" INTEGER NOT NULL DEFAULT 0,
    "rankedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSyntheticFixture" BOOLEAN NOT NULL DEFAULT false,
    "fixtureKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prayer_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prayer_request_category_slug_key" ON "prayer_request_category"("slug");

-- CreateIndex
CREATE INDEX "prayer_request_category_active_sortOrder_idx" ON "prayer_request_category"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "prayer_request_fixtureKey_key" ON "prayer_request"("fixtureKey");

-- CreateIndex
CREATE INDEX "prayer_request_status_contentVisibility_validPrayerCount_rankedAt_idx" ON "prayer_request"("status", "contentVisibility", "validPrayerCount", "rankedAt");

-- CreateIndex
CREATE INDEX "prayer_request_categoryId_status_idx" ON "prayer_request"("categoryId", "status");

-- CreateIndex
CREATE INDEX "prayer_request_authorId_createdAt_idx" ON "prayer_request"("authorId", "createdAt");

-- AddForeignKey
ALTER TABLE "prayer_request" ADD CONSTRAINT "prayer_request_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_request" ADD CONSTRAINT "prayer_request_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "prayer_request_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
