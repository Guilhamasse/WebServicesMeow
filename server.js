import express from 'express';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('TrackMe API is running 🚗');
});

// Test de connexion au démarrage
prisma.$connect()
    .then(() => {
        console.log('✅ Connexion à Neon réussie');
        // Démarrer le serveur après la connexion
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Erreur de connexion à Neon:', error.message);
        process.exit(1);
    });