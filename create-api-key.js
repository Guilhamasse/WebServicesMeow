import { PrismaClient } from '@prisma/client';
import { generateApiKey } from './utils/apiKeyGenerator.js';

const prisma = new PrismaClient();

async function createApiKey() {
    try {
        // Utilisateur ID 1
        const userId = 1;
        
        // Générer une nouvelle clé API
        const newApiKey = generateApiKey();
        
        // Créer la clé en base
        const apiKey = await prisma.apiKey.create({
            data: {
                key: newApiKey,
                name: 'Clé WebSocket Test',
                user_id: userId,
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
        
        console.log('✅ Clé API créée avec succès !');
        console.log('👤 Utilisateur:', apiKey.user.email);
        console.log('🔑 Clé API:', newApiKey);
        console.log('\n🚀 Utilisez cette clé dans le header X-API-Key de vos requêtes');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createApiKey();