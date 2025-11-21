-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_key_hash_key" ON "ApiKey"("key_hash") WHERE "key_hash" IS NOT NULL;

