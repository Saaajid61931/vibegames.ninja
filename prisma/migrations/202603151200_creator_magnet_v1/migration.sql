ALTER TABLE "User"
ADD COLUMN "currentlyBuilding" TEXT;

ALTER TABLE "StudioProfile"
ADD COLUMN "bio" TEXT,
ADD COLUMN "currentlyBuilding" TEXT;

ALTER TABLE "Game"
ADD COLUMN "seekingFeedback" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "latestUpdateNote" TEXT,
ADD COLUMN "weeklyPromptKey" TEXT;

CREATE TABLE "GameFeedback" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fun" BOOLEAN NOT NULL DEFAULT false,
    "confusing" BOOLEAN NOT NULL DEFAULT false,
    "tooHard" BOOLEAN NOT NULL DEFAULT false,
    "buggy" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameFeedback_userId_gameId_key" ON "GameFeedback"("userId", "gameId");
CREATE INDEX "GameFeedback_gameId_createdAt_idx" ON "GameFeedback"("gameId", "createdAt");

ALTER TABLE "GameFeedback"
ADD CONSTRAINT "GameFeedback_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GameFeedback"
ADD CONSTRAINT "GameFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
