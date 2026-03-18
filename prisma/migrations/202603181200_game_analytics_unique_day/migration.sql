-- Remove duplicate daily analytics rows before enforcing the unique day key.
DELETE FROM "GameAnalytics" a
USING "GameAnalytics" b
WHERE a."gameId" = b."gameId"
  AND a."date" = b."date"
  AND a."id" < b."id";

CREATE UNIQUE INDEX IF NOT EXISTS "GameAnalytics_gameId_date_key"
ON "GameAnalytics"("gameId", "date");
