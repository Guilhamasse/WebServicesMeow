-- Supprimer l'index unique sur key s'il existe
DROP INDEX IF EXISTS "ApiKey_key_key";

-- Supprimer l'index sur key s'il existe
DROP INDEX IF EXISTS "ApiKey_key_idx";

-- Supprimer la colonne key si elle existe (la colonne peut avoir déjà été supprimée par une migration précédente)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ApiKey' 
        AND column_name = 'key'
    ) THEN
        ALTER TABLE "ApiKey" DROP COLUMN "key";
    END IF;
END $$;

