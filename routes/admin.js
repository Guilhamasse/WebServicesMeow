import express from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { validateWithSchema, adminCreateUserSchema } from '../middleware/validation.js';
const router = express.Router();



// Toutes les routes admin nécessitent une authentification JWT et le rôle admin
// POST /api/v1/admin/users - Créer un nouvel utilisateur avec une clé API
router.post('/users', authenticateToken, requireAdmin, validateWithSchema(adminCreateUserSchema), AdminController.createUser);

// GET /api/v1/admin/users - Lister tous les utilisateurs
router.get('/users', authenticateToken, requireAdmin, AdminController.listUsers);

// POST /api/v1/admin/users/:id/api-keys - Créer une nouvelle clé API pour un utilisateur
router.post('/users/:id/api-keys', authenticateToken, requireAdmin, AdminController.createApiKey);

// DELETE /api/v1/admin/api-keys/:id - Désactiver une clé API
router.delete('/api-keys/:id', authenticateToken, requireAdmin, AdminController.deactivateApiKey);

export default router;
