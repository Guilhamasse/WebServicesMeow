import express from 'express';
import { PrismaClient } from '@prisma/client';
import { parkingValidation, validate } from '../middleware/validation.js';
import { verifyApiKey } from '../middleware/apiKey.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/v1/parking:
 *   post:
 *     summary: Sauvegarder une nouvelle position de stationnement
 *     tags: [Parking]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParkingRequest'
 *           example:
 *             latitude: 48.8566
 *             longitude: 2.3522
 *             address: "Place de la Concorde, Paris"
 *             note: "Stationnement près du musée"
 *     responses:
 *       201:
 *         description: Position enregistrée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 parking:
 *                   $ref: '#/components/schemas/Parking'
 *       401:
 *         description: Clé API manquante ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Données de validation invalides
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
router.post('/', verifyApiKey, parkingValidation, validate, async (req, res) => {
    try {
        const { latitude, longitude, address, note } = req.body;

        const parking = await prisma.parking.create({
            data: {
                user_id: req.user.id,
                latitude,
                longitude,
                address,
                note
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

        res.status(201).json({
            message: 'Position enregistrée avec succès',
            parking
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible d\'enregistrer la position'
        });
    }
});

/**
 * @swagger
 * /api/v1/parking/current:
 *   get:
 *     summary: Obtenir la dernière position enregistrée
 *     tags: [Parking]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Dernière position récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parking:
 *                   $ref: '#/components/schemas/Parking'
 *       401:
 *         description: Clé API manquante ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Aucune position trouvée
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
router.get('/current', verifyApiKey, async (req, res) => {
    try {
        const parking = await prisma.parking.findFirst({
            where: {
                user_id: req.user.id
            },
            orderBy: {
                created_at: 'desc'
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

        if (!parking) {
            return res.status(404).json({
                error: 'Aucune position trouvée',
                message: 'Vous n\'avez pas encore enregistré de position'
            });
        }

        res.json({
            parking
        });
    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de récupérer la dernière position'
        });
    }
});

/**
 * @swagger
 * /api/v1/parking/history:
 *   get:
 *     summary: Récupérer l'historique des positions
 *     tags: [Parking]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Nombre maximum d'éléments à retourner
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Nombre d'éléments à ignorer (pagination)
 *     responses:
 *       200:
 *         description: Historique récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parkings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Parking'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Nombre total d'éléments
 *                     limit:
 *                       type: integer
 *                       description: Limite utilisée
 *                     offset:
 *                       type: integer
 *                       description: Offset utilisé
 *                     hasMore:
 *                       type: boolean
 *                       description: Indique s'il y a plus d'éléments
 *       401:
 *         description: Clé API manquante ou invalide
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
router.get('/history', verifyApiKey, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const parkings = await prisma.parking.findMany({
            where: {
                user_id: req.user.id
            },
            orderBy: {
                created_at: 'desc'
            },
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        const total = await prisma.parking.count({
            where: {
                user_id: req.user.id
            }
        });

        res.json({
            parkings,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > parseInt(offset) + parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de récupérer l\'historique'
        });
    }
});

/**
 * @swagger
 * /api/v1/parking/{id}:
 *   delete:
 *     summary: Supprimer une position de stationnement
 *     tags: [Parking]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la position à supprimer
 *     responses:
 *       200:
 *         description: Position supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Clé API manquante ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Position introuvable ou non autorisée
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
router.delete('/:id', verifyApiKey, async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que le parking appartient à l'utilisateur
        const parking = await prisma.parking.findFirst({
            where: {
                id: parseInt(id),
                user_id: req.user.id
            }
        });

        if (!parking) {
            return res.status(404).json({
                error: 'Position introuvable',
                message: 'Cette position n\'existe pas ou ne vous appartient pas'
            });
        }

        await prisma.parking.delete({
            where: {
                id: parseInt(id)
            }
        });

        res.json({
            message: 'Position supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de supprimer la position'
        });
    }
});

/**
 * @swagger
 * /api/v1/parking/{id}/start-timer:
 *   post:
 *     summary: Démarrer un chronomètre pour une position de stationnement
 *     tags: [Parking]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la position de stationnement
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: integer
 *                 default: 10
 *                 minimum: 1
 *                 maximum: 3600
 *                 description: Durée du chronomètre en secondes (défaut 10s)
 *           example:
 *             duration: 600
 *     responses:
 *       200:
 *         description: Chronomètre démarré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 timer:
 *                   type: object
 *                   properties:
 *                     parkingId:
 *                       type: integer
 *                     duration:
 *                       type: integer
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                 websocket:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     endpoint:
 *                       type: string
 *       401:
 *         description: Clé API manquante ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Position introuvable ou non autorisée
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
router.post('/:id/start-timer', verifyApiKey, async (req, res) => {
    try {
        const { id } = req.params;
        const { duration = 10 } = req.body;

        // Vérifier que le parking appartient à l'utilisateur
        const parking = await prisma.parking.findFirst({
            where: {
                id: parseInt(id),
                user_id: req.user.id
            }
        });

        if (!parking) {
            return res.status(404).json({
                error: 'Position introuvable',
                message: 'Cette position n\'existe pas ou ne vous appartient pas'
            });
        }

        const startTime = new Date();
        const endTime = new Date(Date.now() + duration * 1000);

        // Envoyer via WebSocket si disponible
        if (req.io) {
            req.io.to(`user_${req.user.id}`).emit('start_timer_request', {
                parkingId: parseInt(id),
                duration: parseInt(duration)
            });
        }

        res.json({
            message: 'Chronomètre démarré via API REST',
            timer: {
                parkingId: parseInt(id),
                duration: parseInt(duration),
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            },
            websocket: {
                message: 'Connectez-vous via WebSocket pour recevoir les notifications en temps réel',
                endpoint: `ws://localhost:${process.env.PORT || 3000}/socket.io/`
            }
        });
    } catch (error) {
        console.error('Erreur lors du démarrage du chronomètre:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de démarrer le chronomètre'
        });
    }
});

/**
 * @swagger
 * /api/v1/parking/{id}:
 *   patch:
 *     summary: Modifier une position de stationnement
 *     tags: [Parking]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la position à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *                 description: Nouvelle adresse
 *               note:
 *                 type: string
 *                 description: Nouvelle note
 *           example:
 *             address: "123 Rue de la Paix, Paris"
 *             note: "Stationnement mis à jour"
 *     responses:
 *       200:
 *         description: Position mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 parking:
 *                   $ref: '#/components/schemas/Parking'
 *       401:
 *         description: Clé API manquante ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Position introuvable ou non autorisée
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
router.patch('/:id', verifyApiKey, async (req, res) => {
    try {
        const { id } = req.params;
        const { address, note } = req.body;

        // Vérifier que le parking appartient à l'utilisateur
        const parking = await prisma.parking.findFirst({
            where: {
                id: parseInt(id),
                user_id: req.user.id
            }
        });

        if (!parking) {
            return res.status(404).json({
                error: 'Position introuvable',
                message: 'Cette position n\'existe pas ou ne vous appartient pas'
            });
        }

        const updatedParking = await prisma.parking.update({
            where: {
                id: parseInt(id)
            },
            data: {
                ...(address !== undefined && { address }),
                ...(note !== undefined && { note })
            }
        });

        res.json({
            message: 'Position mise à jour avec succès',
            parking: updatedParking
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de mettre à jour la position'
        });
    }
});

export default router;

