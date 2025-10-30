import express from 'express';
import 'dotenv/config';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { PrismaClient } from '@prisma/client';
import { specs } from './swagger.config.js';
import authRoutes from './routes/auth.js';
import parkingRoutes from './routes/parking.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middlewares de sécurité
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

app.use(express.json());

/**
 * @swagger
 * /:
 *   get:
 *     summary: Page d'accueil de l'API
 *     description: Informations générales sur l'API WebServices Meow
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Informations sur l'API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 description:
 *                   type: string
 *                 documentation:
 *                   type: string
 *                 endpoints:
 *                   type: object
 */

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WebServices Meow API Documentation',
    swaggerOptions: {
        persistAuthorization: true
    }
}));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'TrackMe API v1.0',
        description: 'API pour gérer vos emplacements de parking',
        documentation: 'Consultez /api-docs pour la documentation Swagger complète',
        swagger_ui: 'http://localhost:3000/api-docs',
        endpoints: {
            auth: '/api/v1/auth',
            parking: '/api/v1/parking',
            admin: '/admin'
        }
    });
});

// Routes API publiques (pour les clients externes)
app.use('/api/v1/parking', parkingRoutes);

// Routes admin (pour créer et gérer les utilisateurs/clés API)
app.use('/admin', adminRoutes);

// Routes auth (optionnel, pour gérer votre propre accès admin)
app.use('/api/v1/auth', authRoutes);

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        message: 'L\'endpoint demandé n\'existe pas',
        path: req.path
    });
});

// Test de connexion au démarrage
prisma.$connect()
    .then(() => {
        console.log('✅ Connexion à Neon réussie');
        // Démarrer le serveur après la connexion
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`📍 API Base URL: http://localhost:${PORT}/api/v1`);
        });
    })
    .catch((error) => {
        console.error('❌ Erreur de connexion à Neon:', error.message);
        process.exit(1);
    });

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});