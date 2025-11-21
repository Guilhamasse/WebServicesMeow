import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyApiKey } from '../middleware/apiKey.js';
import { validateWithSchema, parkingSchema, updateParkingSchema } from '../middleware/validation.js';
import {
create,
current,
history,
update,
destroy,
} from '../controllers/parking.controller.js';

const prisma = new PrismaClient();
const router = express.Router();

// POST /api/v1/parking - Enregistrer une nouvelle position de parking
router.post('/', verifyApiKey, validateWithSchema(parkingSchema), create);

// GET /api/v1/parking/current?user_id=1 - Récupérer la dernière position enregistrée
router.get('/current', verifyApiKey, current);

// GET /api/v1/parking/history?user_id=1 - Récupérer l'historique des positions
router.get('/history', verifyApiKey, history);

// PATCH /api/v1/parking/:id - Mettre à jour une position de parking
router.patch('/:id', verifyApiKey, validateWithSchema(updateParkingSchema), update);

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
        const { user_id, duration = 10 } = req.body;

        if (!user_id) {
            return res.status(400).json({
                error: 'Paramètre manquant',
                message: 'Le paramètre user_id est requis dans le body'
            });
        }

        // Vérifier que le parking appartient à l'utilisateur
        const parking = await prisma.parking.findFirst({
            where: {
                id: parseInt(id),
                user_id: parseInt(user_id)
            }
        });

        if (!parking) {
            return res.status(404).json({
                error: 'Position introuvable',
                message: 'Cette position n\'existe pas ou n\'appartient pas à cet utilisateur'
            });
        }

        const startTime = new Date();
        const endTime = new Date(Date.now() + duration * 1000);

        // Envoyer via WebSocket si disponible
        if (req.io) {
            req.io.to(`user_${user_id}`).emit('start_timer_request', {
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

// DELETE /api/v1/parking/:id?user_id=1 - Supprimer une position de parking
router.delete('/:id', verifyApiKey, destroy);


export default router;
