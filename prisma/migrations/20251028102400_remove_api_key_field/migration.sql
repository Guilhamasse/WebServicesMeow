-- DropIndex
DROP INDEX IF EXISTS "ApiKey_key_idx";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "key";

