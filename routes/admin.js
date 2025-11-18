// routes/admin.routes.js
import express from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * Validation pour créer un user
*/
const createUserValidation = [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('name').optional().isString().withMessage('Le nom doit être une chaîne de caractères'),
    body('expires_in_days').optional().isInt({ min: 1 }).withMessage('Durée invalide')
];

// POST /api/v1/admin/users - Créer un nouvel utilisateur avec une clé API
router.post('/users', createUserValidation, AdminController.createUser);

// GET /api/v1/admin/users - Lister tous les utilisateurs
router.get('/users', AdminController.listUsers);

// POST /api/v1/admin/users/:id/api-keys - Créer une nouvelle clé API pour un utilisateur
router.post('/users/:id/api-keys', AdminController.createApiKey);

// DELETE /api/v1/admin/api-keys/:id - Désactiver une clé API
router.delete('/api-keys/:id', AdminController.deactivateApiKey);

export default router;
