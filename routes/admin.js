// routes/admin.routes.js
import express from 'express';
import { AdminController } from '../controllers/admin.controller.js';

import { 
    validateWithSchema,
    adminCreateUserSchema,
    adminApiKeySchema
} from '../middleware/validation.js';

const router = express.Router();

// 🟢 Créer un utilisateur + clé API
router.post(
    '/users',
    validateWithSchema(adminCreateUserSchema),
    AdminController.createUser
);

// 🟢 Lister les utilisateurs
router.get('/users', AdminController.listUsers);

// 🟢 Créer une API key pour un utilisateur
router.post(
    '/users/:id/api-keys',
    validateWithSchema(adminApiKeySchema),
    AdminController.createApiKey
);

// 🟡 Désactiver une API key
router.delete('/api-keys/:id', AdminController.deactivateApiKey);

export default router;
