import { PrismaClient } from '@prisma/client';
import { hashApiKey } from '../utils/apiKeyGenerator.js';

const prisma = new PrismaClient();

/**
 * Middleware de vérification des clés API
 * La clé doit être fournie dans le header X-API-Key
 */
export const verifyApiKey = async (req, res, next) => {
    try {
        // Récupérer la clé API depuis le header
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({ 
                error: 'Clé API manquante',
                message: 'Veuillez fournir une clé API dans le header X-API-Key' 
            });
        }

        // Hasher la clé API fournie
        const apiKeyHash = hashApiKey(apiKey);

        // Rechercher la clé API dans la base de données par hash
        const keyRecord = await prisma.apiKey.findUnique({
            where: { key_hash: apiKeyHash },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            }
        });

        // Vérifier si la clé existe
        if (!keyRecord) {
            return res.status(401).json({ 
                error: 'Clé API invalide',
                message: 'La clé API fournie est invalide' 
            });
        }

        // Vérifier si la clé est active
        if (!keyRecord.is_active) {
            return res.status(403).json({ 
                error: 'Clé API désactivée',
                message: 'Cette clé API a été désactivée' 
            });
        }

        // Vérifier si la clé est expirée
        if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
            return res.status(403).json({ 
                error: 'Clé API expirée',
                message: 'Cette clé API a expiré' 
            });
        }

        // Mettre à jour la date de dernière utilisation
        await prisma.apiKey.update({
            where: { id: keyRecord.id },
            data: { last_used_at: new Date() }
        });

        // Attacher les informations de la clé API et de l'utilisateur à la requête
        req.apiKey = keyRecord;
        req.user = keyRecord.user;
        
        next();
    } catch (error) {
        console.error('Erreur lors de la vérification de la clé API:', error);
        return res.status(500).json({ 
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de la vérification de la clé API' 
        });
    }
};

/**
 * Middleware optionnel pour vérifier que la clé API appartient à un utilisateur spécifique
 */
export const verifyApiKeyOwner = async (req, res, next) => {
    if (req.apiKey && req.user) {
        next();
    } else {
        res.status(401).json({
            error: 'Authentification requise',
            message: 'Vous devez être authentifié pour accéder à cette ressource'
        });
    }
};