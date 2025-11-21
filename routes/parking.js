import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyApiKey } from '../middleware/apiKey.js';
import { validateWithSchema, parkingSchema, updateParkingSchema } from '../middleware/validation.js';
import {
create,
current,
history,
getOne,
update,
destroy,
} from '../controllers/parking.controller.js';

const prisma = new PrismaClient();
const router = express.Router();

// POST /api/v1/parking/:user_id - Enregistrer une nouvelle position de parking
router.post('/:user_id', verifyApiKey, validateWithSchema(parkingSchema), create);

// GET /api/v1/parking/:user_id/current - Récupérer la dernière position enregistrée
router.get('/:user_id/current', verifyApiKey, current);

// GET /api/v1/parking/:user_id/history - Récupérer l'historique des positions
router.get('/:user_id/history', verifyApiKey, history);

// GET /api/v1/parking/:user_id/:id - Obtenir un parking spécifique
router.get('/:user_id/:id', verifyApiKey, getOne);

// PATCH /api/v1/parking/:user_id/:id - Mettre à jour une position de parking
router.patch('/:user_id/:id', verifyApiKey, validateWithSchema(updateParkingSchema), update);

/**
 * @swagger
 * /api/v1/parking/{user_id}/{id}/start-timer:
 *   post:
 *     summary: Démarrer un chronomètre pour une position de stationnement
 *     tags: [Parking]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
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
router.post('/:user_id/:id/start-timer', verifyApiKey, async (req, res) => {
    try {
        const { user_id, id } = req.params;
        const { duration = 10 } = req.body;

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

// DELETE /api/v1/parking/:user_id/:id - Supprimer une position de parking
router.delete('/:user_id/:id', verifyApiKey, destroy);


export default router;
