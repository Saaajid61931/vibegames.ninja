-- Add support for community level editor and ratings

ALTER TABLE "Game"
ADD COLUMN "hasLevelEditor" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Level" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "data" JSONB NOT NULL,
  "thumbnail" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "plays" INTEGER NOT NULL DEFAULT 0,
  "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "gameId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LevelRating" (
  "id" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "userId" TEXT NOT NULL,
  "levelId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LevelRating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GameRating" (
  "id" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "userId" TEXT NOT NULL,
  "gameId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GameRating_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Level_gameId_status_createdAt_idx" ON "Level"("gameId", "status", "createdAt");
CREATE INDEX "Level_gameId_status_avgRating_idx" ON "Level"("gameId", "status", "avgRating");
CREATE INDEX "Level_creatorId_createdAt_idx" ON "Level"("creatorId", "createdAt");
CREATE INDEX "LevelRating_levelId_idx" ON "LevelRating"("levelId");
CREATE INDEX "GameRating_gameId_idx" ON "GameRating"("gameId");

CREATE UNIQUE INDEX "LevelRating_userId_levelId_key" ON "LevelRating"("userId", "levelId");
CREATE UNIQUE INDEX "GameRating_userId_gameId_key" ON "GameRating"("userId", "gameId");

ALTER TABLE "Level"
ADD CONSTRAINT "Level_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Level"
ADD CONSTRAINT "Level_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LevelRating"
ADD CONSTRAINT "LevelRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LevelRating"
ADD CONSTRAINT "LevelRating_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GameRating"
ADD CONSTRAINT "GameRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GameRating"
ADD CONSTRAINT "GameRating_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
