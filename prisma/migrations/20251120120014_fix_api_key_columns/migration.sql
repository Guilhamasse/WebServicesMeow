-- AlterTable: Ajouter les colonnes key_hash et key_prefix si elles n'existent pas
ALTER TABLE "ApiKey" 
ADD COLUMN IF NOT EXISTS "key_hash" TEXT,
ADD COLUMN IF NOT EXISTS "key_prefix" TEXT;

-- CreateIndex: Créer l'index unique sur key_hash s'il n'existe pas
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_key_hash_key" ON "ApiKey"("key_hash") WHERE "key_hash" IS NOT NULL;

