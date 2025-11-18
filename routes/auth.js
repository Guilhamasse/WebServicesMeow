import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { registerValidation, loginValidation, validate } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/v1/auth/register - Créer un nouveau compte utilisateur
router.post('/register', registerValidation, validate, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'Email déjà utilisé',
                message: 'Un compte avec cet email existe déjà'
            });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                email: true,
                created_at: true
            }
        });

        // Générer un token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Compte créé avec succès',
            user,
            token
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de créer le compte'
        });
    }
});

// POST /api/v1/auth/login - Se connecter et recevoir un token JWT
router.post('/login', loginValidation, validate, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                parkings: {
                    take: 1,
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Identifiants invalides',
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Identifiants invalides',
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Générer un token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Retourner les informations utilisateur (sans le mot de passe)
        const userData = {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            lastParking: user.parkings[0] || null
        };

        res.json({
            message: 'Connexion réussie',
            user: userData,
            token
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de se connecter'
        });
    }
});

// GET /api/v1/auth/profile - Récupérer le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                parkings: {
                    take: 1,
                    orderBy: { created_at: 'desc' }
                },
                _count: {
                    select: { parkings: true }
                }
            },
            select: {
                id: true,
                email: true,
                created_at: true,
                parkings: true,
                _count: true
            }
        });

        res.json({
            user: {
                ...user,
                lastParking: user.parkings[0] || null,
                parkingsCount: user._count.parkings
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de récupérer le profil'
        });
    }
});

export default router;

