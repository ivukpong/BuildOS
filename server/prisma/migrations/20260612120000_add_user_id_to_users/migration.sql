-- Add persistent business user identifier.
ALTER TABLE "User"
ADD COLUMN "userId" TEXT;

-- Backfill existing users with stable IDs.
UPDATE "User"
SET "userId" = 'BOS-' || to_char("createdAt", 'YYMM') || '-' || upper(substr(md5("id"), 1, 6))
WHERE "userId" IS NULL;

CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");
