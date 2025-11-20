import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateApiKey } from './utils/apiKeyGenerator.js';

const prisma = new PrismaClient();

async function setupUserAndApiKey() {
    try {
        // 1. Créer l'utilisateur
        const hashedPassword = await bcrypt.hash('Password123', 10);
        
        const user = await prisma.user.create({
            data: {
                email: 'new@exemple.com',
                password: hashedPassword
            }
        });
        
        // 2. Générer un token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        // 3. Créer une clé API
        const apiKey = generateApiKey();
        
        const apiKeyRecord = await prisma.apiKey.create({
            data: {
                key: apiKey,
                name: 'Clé WebSocket Test',
                user_id: user.id,
                is_active: true,
                expires_at: null
            }
        });
        
        console.log('✅ Setup complet !');
        console.log('👤 Utilisateur:', user.email, '(ID:', user.id + ')');
        console.log('🔑 Token JWT:', token);
        console.log('🔐 Clé API:', apiKey);
        console.log('\n🚀 Utilisez ces informations dans la page de test');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setupUserAndApiKey();