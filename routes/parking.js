import express from 'express';
import { verifyApiKey } from '../middleware/apiKey.js';
import { parkingValidation, validate } from '../middleware/validation.js';
import {
create,
current,
history,
update,
destroy,
} from '../controllers/parking.controller.js';


const router = express.Router();

// POST /api/v1/parking - Enregistrer une nouvelle position de parking
router.post('/', verifyApiKey, parkingValidation, validate, create);

// GET /api/v1/parking/current - Récupérer la dernière position enregistrée
router.get('/current', verifyApiKey, current);

// GET /api/v1/parking/history - Récupérer l'historique des positions
router.get('/history', verifyApiKey, history);

// PATCH /api/v1/parking/:id - Mettre à jour une position de parking
router.patch('/:id', verifyApiKey, update);

// DELETE /api/v1/parking/:id - Supprimer une position de parking
router.delete('/:id', verifyApiKey, destroy);


export default router;
