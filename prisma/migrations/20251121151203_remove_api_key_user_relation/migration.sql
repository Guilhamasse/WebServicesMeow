-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT IF EXISTS "ApiKey_user_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "ApiKey_user_id_idx";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "user_id";

