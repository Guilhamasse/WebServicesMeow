-- Supprimer l'index unique sur key s'il existe
DROP INDEX IF EXISTS "ApiKey_key_key";

-- Supprimer l'index sur key s'il existe
DROP INDEX IF EXISTS "ApiKey_key_idx";

-- Supprimer la contrainte NOT NULL sur key si elle existe (en rendant la colonne nullable d'abord)
ALTER TABLE "ApiKey" ALTER COLUMN "key" DROP NOT NULL;

-- Supprimer la colonne key si elle existe
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "key";

