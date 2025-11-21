import { PrismaClient } from '@prisma/client';
import { generateApiKey, hashApiKey, extractPrefix } from './utils/apiKeyGenerator.js';
import 'dotenv/config';

const prisma = new PrismaClient();

async function createApiKey() {
    try {
        // Utilisateur ID 1
        const userId = 1;
        
        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true }
        });
        
        if (!user) {
            console.error(`❌ Utilisateur avec l'ID ${userId} introuvable`);
            process.exit(1);
        }
        
        // Générer une nouvelle clé API
        const newApiKey = generateApiKey();
        const keyHash = hashApiKey(newApiKey);
        const keyPrefix = extractPrefix(newApiKey);
        
        // Créer la clé en base
        const apiKeyRecord = await prisma.apiKey.create({
            data: {
                user_id: userId,
                key_hash: keyHash,
                key_prefix: keyPrefix,
                name: `Clé API - ${new Date().toLocaleDateString()}`,
                is_active: true,
                expires_at: null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            }
        });
        
        console.log('\n✅ Clé API créée avec succès !\n');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`👤 Utilisateur: ${user.email} (ID: ${user.id})`);
        console.log(`📝 Nom de la clé: ${apiKeyRecord.name}`);
        console.log(`🆔 ID de la clé: ${apiKeyRecord.id}`);
        console.log('═══════════════════════════════════════════════════════');
        console.log('\n🔑 VOTRE CLÉ API (à conserver en sécurité):\n');
        console.log(newApiKey);
        console.log('\n⚠️  IMPORTANT: Cette clé ne sera affichée qu\'une seule fois!');
        console.log('   Conservez-la dans un endroit sûr.\n');
        console.log('🚀 Utilisez cette clé dans le header X-API-Key de vos requêtes\n');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message || error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createApiKey();