// routes/admin.routes.js
import express from 'express';
import { body } from 'express-validator';
import { AdminController } from '../controllers/admin.controller.js';

const router = express.Router();

const createUserValidation = [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('name').optional().isString().withMessage('Le nom doit être une chaîne de caractères'),
    body('expires_in_days').optional().isInt({ min: 1 }).withMessage('Durée invalide')
];

router.post('/users', createUserValidation, AdminController.createUser);
router.get('/users', AdminController.listUsers);
router.post('/users/:id/api-keys', AdminController.createApiKey);
router.delete('/api-keys/:id', AdminController.deactivateApiKey);

export default router;
