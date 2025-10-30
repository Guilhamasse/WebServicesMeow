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


// POST /parking — créer une nouvelle position
router.post('/', verifyApiKey, parkingValidation, validate, create);


// GET /parking/current — dernière position
router.get('/current', verifyApiKey, current);


// GET /parking/history — historique paginé
router.get('/history', verifyApiKey, history);


// PATCH /parking/:id — maj note/adresse
router.patch('/:id', verifyApiKey, update);


// DELETE /parking/:id — suppression
router.delete('/:id', verifyApiKey, destroy);


export default router;