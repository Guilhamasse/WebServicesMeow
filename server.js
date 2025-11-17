// server.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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

/* ------------------------------- 🧭 Routes ------------------------------ */
// Page d’accueil
app.get('/', (req, res) => {
  res.json({
    message: '🚗 TrackMe API v1.0',
    description: 'API pour gérer vos emplacements de parking et vos clés API.',
    documentation: 'Consultez /api/v1 pour les endpoints disponibles.',
    endpoints: {
      auth: '/api/v1/auth',
      parking: '/api/v1/parking',
      admin: '/api/v1/admin'
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
