import express from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { validateWithSchema, adminCreateUserSchema } from '../middleware/validation.js';

const router = express.Router();

// 🟢 Créer un utilisateur + clé API
router.post('/users', validateWithSchema(adminCreateUserSchema), AdminController.createUser);

// 🔹 Liste des utilisateurs
router.get('/users', AdminController.listUsers);

// 🔹 Créer une clé API pour un utilisateur existant
router.post('/users/:id/api-keys', AdminController.createApiKey);

// 🔹 Désactiver une clé API
router.delete('/api-keys/:id', AdminController.deactivateApiKey);

export default router;
