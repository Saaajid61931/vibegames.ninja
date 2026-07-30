ALTER TABLE "Game"
ADD COLUMN "impressions" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "GameAnalytics"
ADD COLUMN "impressions" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Game_status_impressions_idx" ON "Game"("status", "impressions");
