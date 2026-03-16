ALTER TABLE "GameJamEntry"
DROP CONSTRAINT IF EXISTS "GameJamEntry_jamId_userId_key";

CREATE INDEX IF NOT EXISTS "GameJamEntry_jamId_userId_idx"
ON "GameJamEntry"("jamId", "userId");
