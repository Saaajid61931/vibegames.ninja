-- AlterTable
ALTER TABLE "Game"
ADD COLUMN "hasGhostSharing" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "GhostRun" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "levelId" TEXT,
    "userId" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "replayData" JSONB NOT NULL,
    "replayVersion" TEXT,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GhostRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GhostRun_gameId_createdAt_idx" ON "GhostRun"("gameId", "createdAt");

-- CreateIndex
CREATE INDEX "GhostRun_gameId_levelId_durationMs_idx" ON "GhostRun"("gameId", "levelId", "durationMs");

-- CreateIndex
CREATE INDEX "GhostRun_userId_gameId_levelId_durationMs_idx" ON "GhostRun"("userId", "gameId", "levelId", "durationMs");

-- AddForeignKey
ALTER TABLE "GhostRun" ADD CONSTRAINT "GhostRun_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostRun" ADD CONSTRAINT "GhostRun_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostRun" ADD CONSTRAINT "GhostRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
