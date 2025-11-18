import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware pour vérifier que l'utilisateur a le rôle admin
 * Doit être utilisé après authenticateToken ou verifyApiKey
 */
export const requireAdmin = async (req, res, next) => {
    try {
        // Vérifier que l'utilisateur est attaché à la requête
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                error: 'Authentification requise',
                message: 'Vous devez être authentifié pour accéder à cette ressource'
            });
        }

        // Récupérer l'utilisateur complet avec son rôle depuis la base de données
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, role: true }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Utilisateur introuvable',
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier que l'utilisateur a le rôle admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                error: 'Accès interdit',
                message: 'Vous devez être administrateur pour accéder à cette ressource'
            });
        }

        // Mettre à jour req.user avec le rôle
        req.user = user;
        next();
    } catch (error) {
        console.error('Erreur lors de la vérification du rôle:', error);
        return res.status(500).json({
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de la vérification des permissions'
        });
    }
};

