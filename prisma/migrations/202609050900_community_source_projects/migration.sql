-- CreateTable
CREATE TABLE "GameAppreciation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAppreciation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspirationCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspirationCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "collectionId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("collectionId","gameId")
);

-- CreateTable
CREATE TABLE "GameStory" (
    "gameId" TEXT NOT NULL,
    "idea" TEXT NOT NULL DEFAULT '',
    "lessons" TEXT NOT NULL DEFAULT '',
    "nextIdea" TEXT NOT NULL DEFAULT '',
    "inspiredById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameStory_pkey" PRIMARY KEY ("gameId")
);

-- CreateTable
CREATE TABLE "SourcePackage" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "readme" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "requirements" TEXT NOT NULL DEFAULT '',
    "exclusions" TEXT NOT NULL DEFAULT '',
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,

    CONSTRAINT "SourcePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceOrder" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "checkoutId" TEXT,
    "paymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "SourceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorPayoutAccount" (
    "userId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorPayoutAccount_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "GameAppreciation_gameId_idx" ON "GameAppreciation"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameAppreciation_userId_gameId_key" ON "GameAppreciation"("userId", "gameId");

-- CreateIndex
CREATE INDEX "InspirationCollection_userId_updatedAt_idx" ON "InspirationCollection"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "InspirationCollection_isPublic_updatedAt_idx" ON "InspirationCollection"("isPublic", "updatedAt");

-- CreateIndex
CREATE INDEX "CollectionItem_gameId_idx" ON "CollectionItem"("gameId");

-- CreateIndex
CREATE INDEX "SourcePackage_status_createdAt_idx" ON "SourcePackage"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SourcePackage_gameId_version_key" ON "SourcePackage"("gameId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SourceOrder_checkoutId_key" ON "SourceOrder"("checkoutId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceOrder_paymentIntentId_key" ON "SourceOrder"("paymentIntentId");

-- CreateIndex
CREATE INDEX "SourceOrder_buyerId_status_idx" ON "SourceOrder"("buyerId", "status");

-- CreateIndex
CREATE INDEX "SourceOrder_packageId_status_idx" ON "SourceOrder"("packageId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorPayoutAccount_stripeAccountId_key" ON "CreatorPayoutAccount"("stripeAccountId");

-- AddForeignKey
ALTER TABLE "GameAppreciation" ADD CONSTRAINT "GameAppreciation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAppreciation" ADD CONSTRAINT "GameAppreciation_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationCollection" ADD CONSTRAINT "InspirationCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "InspirationCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameStory" ADD CONSTRAINT "GameStory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameStory" ADD CONSTRAINT "GameStory_inspiredById_fkey" FOREIGN KEY ("inspiredById") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcePackage" ADD CONSTRAINT "SourcePackage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceOrder" ADD CONSTRAINT "SourceOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceOrder" ADD CONSTRAINT "SourceOrder_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SourcePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayoutAccount" ADD CONSTRAINT "CreatorPayoutAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Preserve historical appreciation without removing any saved games.
INSERT INTO "GameAppreciation" ("id", "userId", "gameId", "createdAt")
SELECT 'legacy_' || "id", "userId", "gameId", "createdAt" FROM "Favorite"
ON CONFLICT ("userId", "gameId") DO NOTHING;

-- Keep source reuse distinct from inspiration and preserve purchase support history.
ALTER TABLE "GameStory" ADD COLUMN "builtFromPackageId" TEXT;
ALTER TABLE "GameStory" ADD CONSTRAINT "GameStory_builtFromPackageId_fkey" FOREIGN KEY ("builtFromPackageId") REFERENCES "SourcePackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SourceOrder" ADD COLUMN "refundRequestedAt" TIMESTAMP(3), ADD COLUMN "refundReason" TEXT, ADD COLUMN "supportReply" TEXT;
