import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware d'authentification JWT
 */
export const authenticateToken = async (req, res, next) => {
    try {
        // Récupérer le token depuis le header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Token manquant',
                message: 'Vous devez être connecté pour accéder à cette ressource' 
            });
        }

        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Récupérer l'utilisateur depuis la base de données
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, created_at: true }
        });

        if (!user) {
            return res.status(401).json({ 
                error: 'Utilisateur introuvable',
                message: 'Token invalide' 
            });
        }

        // Attacher l'utilisateur à la requête
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Token invalide',
                message: 'Veuillez vous reconnecter' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expiré',
                message: 'Votre session a expiré, veuillez vous reconnecter' 
            });
        }
        console.error('Erreur authentification:', error);
        return res.status(500).json({ 
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de l\'authentification' 
        });
    }
};

