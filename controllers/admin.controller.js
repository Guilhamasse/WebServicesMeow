// controllers/admin.controller.js
import { validationResult } from 'express-validator';
import { AdminService } from '../services/admin.service.js';

export class AdminController {
    static async createUser(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Erreur de validation',
                details: errors.array()
            });
        }

        try {
            const { email, name, expires_in_days } = req.body;
            const result = await AdminService.createUser(email, name, expires_in_days);

            res.status(201).json({
                message: 'Utilisateur et clé API créés avec succès',
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    created_at: result.user.created_at
                },
                apiKey: {
                    key: result.apiKey.key,
                    name: result.apiKey.name,
                    created_at: result.apiKey.created_at,
                    expires_at: result.apiKey.expires_at
                },
                warning: '⚠️ Conservez ces informations en sécurité'
            });
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({
                error: 'Erreur serveur',
                message: error.message || 'Impossible de créer l\'utilisateur'
            });
        }
    }

    static async listUsers(req, res) {
        try {
            const users = await AdminService.listUsers();
            res.json({ users, total: users.length });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'Erreur serveur',
                message: 'Impossible de récupérer les utilisateurs'
            });
        }
    }

    static async createApiKey(req, res) {
        try {
            const { id } = req.params;
            const { name, expires_in_days } = req.body;

            const apiKey = await AdminService.createApiKeyForUser(id, name, expires_in_days);
            res.status(201).json({
                message: 'Clé API créée avec succès',
                apiKey,
                warning: '⚠️ Conservez cette clé en sécurité'
            });
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({
                error: 'Erreur serveur',
                message: error.message || 'Impossible de créer la clé API'
            });
        }
    }

    static async deactivateApiKey(req, res) {
        try {
            const { id } = req.params;
            const result = await AdminService.deactivateApiKey(id);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({
                error: 'Erreur serveur',
                message: error.message || 'Impossible de désactiver la clé API'
            });
        }
    }
}
