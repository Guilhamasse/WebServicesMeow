import express from 'express';
import { PrismaClient } from '@prisma/client';
import { parkingValidation, validate } from '../middleware/validation.js';
import { verifyApiKey } from '../middleware/apiKey.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /parking
 * Sauvegarder une nouvelle position
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
 * GET /parking/current
 * Obtenir la dernière position enregistrée
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
 * GET /parking/history
 * Récupérer l'historique des positions
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
 * DELETE /parking/:id
 * Supprimer une position
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
 * PATCH /parking/:id
 * Modifier une position (note, adresse)
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

