import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateApiKey } from '../utils/apiKeyGenerator.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Validation pour créer un user
 */
const createUserValidation = [
    body('email')
        .isEmail()
        .withMessage('Email invalide')
        .normalizeEmail(),
    body('name')
        .optional()
        .isString()
        .withMessage('Le nom doit être une chaîne de caractères'),
    body('expires_in_days')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La durée d\'expiration doit être un nombre entier positif')
];

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Créer un utilisateur avec sa clé API
 *     description: Utilisé par le propriétaire de l'API pour provisionner des clients
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *               name:
 *                 type: string
 *                 description: Nom optionnel pour la clé API
 *               expires_in_days:
 *                 type: integer
 *                 minimum: 1
 *                 description: Durée d'expiration en jours (optionnel)
 *           example:
 *             email: "client@exemple.com"
 *             name: "Clé API Client Test"
 *             expires_in_days: 365
 *     responses:
 *       201:
 *         description: Utilisateur et clé API créés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 apiKey:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       description: La clé API générée
 *                     name:
 *                       type: string
 *                       description: Nom de la clé
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Date d'expiration
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Clé API manquante ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/users', createUserValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Erreur de validation',
            details: errors.array()
        });
    }

    try {
        const { email, name, expires_in_days } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'Utilisateur existe déjà',
                message: 'Un utilisateur avec cet email existe déjà'
            });
        }

        // Générer une clé API
        const apiKey = generateApiKey();

        // Calculer la date d'expiration si spécifiée
        let expires_at = null;
        if (expires_in_days) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(expires_in_days));
            expires_at = expiryDate;
        }

        // Créer l'utilisateur et sa clé API dans une transaction
        const result = await prisma.$transaction(async (tx) => {
            // Créer l'utilisateur (sans mot de passe puisqu'il ne se connectera pas)
            const user = await tx.user.create({
                data: {
                    email,
                    password: 'disabled' // Pas de login possible
                }
            });

            // Créer la clé API
            const keyRecord = await tx.apiKey.create({
                data: {
                    user_id: user.id,
                    key: apiKey,
                    name: name || `Clé pour ${email}`,
                    expires_at
                }
            });

            return { user, apiKey: keyRecord };
        });

        res.status(201).json({
            message: 'Utilisateur et clé API créés avec succès',
            user: {
                id: result.user.id,
                email: result.user.email,
                created_at: result.user.created_at
            },
            apiKey: {
                key: result.apiKey.key,
                name: result.apiKey.name,
                created_at: result.apiKey.created_at,
                expires_at: result.apiKey.expires_at
            },
            warning: '⚠️ Conservez ces informations en sécurité'
        });
    } catch (error) {
        console.error('Erreur lors de la création:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de créer l\'utilisateur et la clé API'
        });
    }
});

/**
 * GET /admin/users
 * Lister tous les utilisateurs avec leurs clés API
 */
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                apiKeys: {
                    select: {
                        id: true,
                        key: true,
                        name: true,
                        is_active: true,
                        created_at: true,
                        last_used_at: true,
                        expires_at: true
                    },
                    orderBy: {
                        created_at: 'desc'
                    }
                },
                _count: {
                    select: {
                        parkings: true,
                        apiKeys: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.json({
            users: users.map(user => ({
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                apiKeysCount: user._count.apiKeys,
                parkingsCount: user._count.parkings,
                apiKeys: user.apiKeys.map(k => ({
                    ...k,
                    key: k.key.substring(0, 15) + '...' + k.key.substring(k.key.length - 8)
                }))
            })),
            total: users.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de récupérer les utilisateurs'
        });
    }
});

/**
 * POST /admin/users/:id/api-keys
 * Créer une clé API supplémentaire pour un utilisateur existant
 */
router.post('/users/:id/api-keys', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, expires_in_days } = req.body;

        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return res.status(404).json({
                error: 'Utilisateur introuvable',
                message: 'Cet utilisateur n\'existe pas'
            });
        }

        // Générer une nouvelle clé API
        const apiKey = generateApiKey();

        // Calculer la date d'expiration
        let expires_at = null;
        if (expires_in_days) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(expires_in_days));
            expires_at = expiryDate;
        }

        // Créer la clé
        const keyRecord = await prisma.apiKey.create({
            data: {
                user_id: parseInt(id),
                key: apiKey,
                name: name || `Clé API - ${new Date().toLocaleDateString()}`,
                expires_at
            }
        });

        res.status(201).json({
            message: 'Clé API créée avec succès',
            apiKey: {
                id: keyRecord.id,
                key: keyRecord.key,
                name: keyRecord.name,
                created_at: keyRecord.created_at,
                expires_at: keyRecord.expires_at
            },
            warning: '⚠️ Conservez cette clé en sécurité'
        });
    } catch (error) {
        console.error('Erreur lors de la création de la clé:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de créer la clé API'
        });
    }
});

/**
 * DELETE /admin/api-keys/:id
 * Désactiver une clé API
 */
router.delete('/api-keys/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que la clé existe
        const keyRecord = await prisma.apiKey.findUnique({
            where: { id: parseInt(id) }
        });

        if (!keyRecord) {
            return res.status(404).json({
                error: 'Clé API introuvable',
                message: 'Cette clé API n\'existe pas'
            });
        }

        // Désactiver la clé
        await prisma.apiKey.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });

        res.json({
            message: 'Clé API désactivée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de désactiver la clé API'
        });
    }
});

export default router;

