// services/admin.service.js
import { PrismaClient } from '@prisma/client';
import { generateApiKey, hashApiKey, extractPrefix } from '../utils/apiKeyGenerator.js';

const prisma = new PrismaClient();

export class AdminService {
    static async createUser(email, name, expires_in_days) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw { status: 409, message: 'Un utilisateur avec cet email existe déjà' };
        }

        const apiKey = generateApiKey();
        const keyHash = hashApiKey(apiKey);
        const keyPrefix = extractPrefix(apiKey);
        let expires_at = null;
        if (expires_in_days) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(expires_in_days));
            expires_at = expiryDate;
        }

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { email, password: 'disabled', role: 'user' }
            });

            const apiKeyRecord = await tx.apiKey.create({
                data: {
                    user_id: user.id,
                    key_hash: keyHash,
                    key_prefix: keyPrefix,
                    name: name || `Clé pour ${email}`,
                    expires_at
                }
            });

            // Retourner la clé en clair pour l'affichage (une seule fois)
            return { 
                user, 
                apiKey: {
                    ...apiKeyRecord,
                    key: apiKey // Ajouter la clé en clair pour l'affichage
                }
            };
        });

        return result;
    }

    static async listUsers() {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                created_at: true,
                apiKeys: {
                    select: {
                        id: true,
                        key_hash: true,
                        key_prefix: true,
                        name: true,
                        is_active: true,
                        created_at: true,
                        last_used_at: true,
                        expires_at: true
                    },
                    orderBy: { created_at: 'desc' }
                },
                _count: { select: { parkings: true, apiKeys: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        return users.map(user => ({
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            apiKeysCount: user._count.apiKeys,
            parkingsCount: user._count.parkings,
            apiKeys: user.apiKeys.map(k => ({
                id: k.id,
                name: k.name,
                is_active: k.is_active,
                created_at: k.created_at,
                last_used_at: k.last_used_at,
                expires_at: k.expires_at,
                key_prefix: k.key_prefix ? `${k.key_prefix}***` : null
            }))
        }));
    }

    static async createApiKeyForUser(userId, name, expires_in_days) {
        const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
        if (!user) {
            throw { status: 404, message: 'Utilisateur introuvable' };
        }

        const apiKey = generateApiKey();
        const keyHash = hashApiKey(apiKey);
        const keyPrefix = extractPrefix(apiKey);
        let expires_at = null;
        if (expires_in_days) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(expires_in_days));
            expires_at = expiryDate;
        }

        const apiKeyRecord = await prisma.apiKey.create({
            data: {
                user_id: parseInt(userId),
                key_hash: keyHash,
                key_prefix: keyPrefix,
                name: name || `Clé API - ${new Date().toLocaleDateString()}`,
                expires_at
            }
        });

        // Retourner la clé en clair pour l'affichage (une seule fois)
        return {
            ...apiKeyRecord,
            key: apiKey // Ajouter la clé en clair pour l'affichage
        };
    }

    static async deactivateApiKey(id) {
        const keyRecord = await prisma.apiKey.findUnique({ where: { id: parseInt(id) } });
        if (!keyRecord) {
            throw { status: 404, message: 'Clé API introuvable' };
        }

        await prisma.apiKey.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });

        return { message: 'Clé API désactivée avec succès' };
    }
}
