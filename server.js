// server.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { specs } from './swagger.config.js';
import parkingRoutes from './routes/parking.js';
import router from './routes/router.js'; // ✅ Routeur centralisé

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

/* ----------------------------- 🔒 Sécurité ----------------------------- */
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

/* ---------------------------- ⚙️ Middlewares ---------------------------- */
app.use(express.json());

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

// ✅ Toutes les routes versionnées
app.use('/api/v1', router);
app.use('/api/v1/parking', parkingRoutes);


/* ---------------------------- 🚫 404 Not Found ---------------------------- */
app.use((req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        message: 'L’endpoint demandé n’existe pas',
        path: req.path
    });
});

/* -------------------------- 🧠 Gestion des erreurs -------------------------- */
app.use((err, req, res, next) => {
    console.error('🔥 Erreur serveur:', err);
    res.status(err.status || 500).json({
        error: 'Erreur serveur',
        message: err.message || 'Une erreur interne est survenue'
    });
});

/* -------------------------- 🔌 Connexion à la DB --------------------------- */
async function startServer() {
    try {
        await prisma.$connect();
        console.log('✅ Connexion à Neon réussie');

        app.listen(PORT, () => {
            console.log(`🚀 Serveur en cours sur http://localhost:${PORT}`);
            console.log(`📍 Base API: http://localhost:${PORT}/api/v1`);
        });
    } catch (error) {
        console.error('❌ Erreur de connexion à Neon:', error.message);
        process.exit(1);
    }
}

/* ---------------------------- 🧩 Gestion globale --------------------------- */
process.on('unhandledRejection', (error) => {
    console.error('⚠️ Unhandled Rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

/* ------------------------------- ▶️ Start ------------------------------- */
startServer();
