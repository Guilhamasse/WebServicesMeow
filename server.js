// server.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { specs } from './swagger.config.js';
import parkingRoutes from './routes/parking.js';
import { setupWebSocket } from './websocket/websocket.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Création du serveur HTTP pour WebSocket
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

/* ----------------------------- 🔒 Sécurité avec configuration pour WebSocket ----------------------------- */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'"],
            scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "ws://localhost:3000", "http://localhost:3000"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
        },
    },
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

/* ---------------------------- ⚙️ Middlewares ---------------------------- */
app.use(express.json());

// Servir les fichiers statiques et le fichier de test WebSocket
app.use(express.static('.'));

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
        websocket_test: 'http://localhost:3000/test-simple',
        endpoints: {
            auth: '/api/v1/auth',
            parking: '/api/v1/parking',
            admin: '/admin',
            websocket: 'ws://localhost:3000/socket.io/'
        },
        websocket_features: [
            'Chronomètre de stationnement avec notifications',
            'Notifications en temps réel',
            'Authentification JWT via WebSocket',
            'Interface de test intégrée'
        ]
    });
});

// Test WebSocket simple intégré
app.get('/test-simple', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Test WebSocket Simple</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        button { padding: 15px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0056b3; }
        input { width: 500px; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
        #logs { height: 400px; overflow-y: auto; background: #1a1a1a; color: #00ff00; padding: 15px; font-family: monospace; margin: 20px 0; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; }
        .connected { background: #d4edda; color: #155724; }
        .disconnected { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚗 Test WebSocket Chronomètre</h1>
        
        <h3>🔑 Token JWT:</h3>
        <input type="text" id="tokenInput" placeholder="Collez votre token JWT ici..." value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoibmV3QGV4ZW1wbGUuY29tIiwiaWF0IjoxNzYzNjQ0MjY1LCJleHAiOjE3NjQyNDkwNjV9.YmaXm7Zb2RCqtyeuHCmN8Ovp9-hFGc9UgtSqqW54mek">
        
        <h3>🏠 Parking ID:</h3>
        <input type="number" id="parkingIdInput" placeholder="ID du parking" value="1" min="1">
        <button onclick="createParking()">➕ Créer Parking</button>
        
        <h3>🔌 Actions:</h3>
        <button onclick="testJS()">1️⃣ Test JavaScript</button>
        <button onclick="connectWS()">2️⃣ Connecter WebSocket</button>
        <button onclick="startTimer()">3️⃣ Démarrer Chrono (10s)</button>
        <button onclick="disconnect()">❌ Déconnecter</button>
        
        <div id="status" class="status disconnected">❌ Déconnecté</div>
        
        <h3>📋 Logs:</h3>
        <div id="logs">Logs apparaîtront ici...<br></div>
        
        <button onclick="clearLogs()">🗑️ Effacer logs</button>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        let socket = null;
        
        function log(msg) {
            document.getElementById('logs').innerHTML += new Date().toLocaleTimeString() + ': ' + msg + '<br>';
            document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight;
            console.log(msg);
        }
        
        function testJS() {
            alert('✅ JavaScript fonctionne !');
            log('✅ JavaScript opérationnel');
        }
        
        function connectWS() {
            const token = document.getElementById('tokenInput').value.trim();
            if (!token) {
                alert('⚠️ Token manquant !');
                return;
            }
            
            log('🔌 Connexion WebSocket...');
            log('🔑 Token: ' + token.substring(0, 20) + '...');
            
            try {
                socket = io('http://localhost:3000', {
                    auth: { token: token },
                    timeout: 10000
                });
                
                socket.on('connect', function() {
                    log('🎉 CONNECTÉ ! ID: ' + socket.id);
                    document.getElementById('status').className = 'status connected';
                    document.getElementById('status').textContent = '✅ Connecté';
                });
                
                socket.on('connected', function(data) {
                    log('👤 Bienvenue: ' + data.email + ' (ID: ' + data.userId + ')');
                });
                
                socket.on('connect_error', function(error) {
                    log('❌ ERREUR: ' + error.message);
                    document.getElementById('status').textContent = '❌ Erreur: ' + error.message;
                });
                
                socket.on('timer_started', function(data) {
                    log('⏱️ CHRONO DÉMARRÉ: ' + data.duration + 's');
                });
                
                socket.on('parking_time_expired', function(data) {
                    log('🚨 TEMPS ÉCOULÉ ! ' + data.message);
                    alert('⏰ NOTIFICATION: ' + data.message);
                });
                
            } catch (error) {
                log('💥 ERREUR: ' + error.message);
            }
        }
        
        function createParking() {
            const token = document.getElementById('tokenInput').value.trim();
            if (!token) {
                alert('⚠️ Token manquant pour créer le parking !');
                return;
            }
            
            log('🏗️ Création d\\\'un parking...');
            
            fetch('http://localhost:3000/api/v1/parking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'X-API-Key': 'tk_live_uK4yxntglCNVptME0JSwRBfXLGhyoTdS5EX7VM5R6ZQ='
                },
                body: JSON.stringify({
                    latitude: 48.8566,
                    longitude: 2.3522,
                    address: "Tour Eiffel, Paris",
                    note: "Test parking WebSocket"
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.parking && data.parking.id) {
                    log('✅ Parking créé ! ID: ' + data.parking.id);
                    document.getElementById('parkingIdInput').value = data.parking.id;
                } else if (data.id) {
                    log('✅ Parking créé ! ID: ' + data.id);
                    document.getElementById('parkingIdInput').value = data.id;
                } else {
                    log('❌ Erreur création parking: ' + JSON.stringify(data));
                }
            })
            .catch(error => {
                log('❌ Erreur réseau: ' + error.message);
            });
        }
        
        function startTimer() {
            if (!socket) {
                log('❌ Pas de connexion WebSocket');
                return;
            }
            
            const parkingId = document.getElementById('parkingIdInput').value;
            log('▶️ Démarrage chrono 10 secondes pour parking ID: ' + parkingId + '...');
            socket.emit('start_parking_timer', {
                parkingId: parseInt(parkingId),
                duration: 10
            });
        }
        
        function disconnect() {
            if (socket) {
                socket.disconnect();
                socket = null;
                log('🔌 Déconnecté');
                document.getElementById('status').className = 'status disconnected';
                document.getElementById('status').textContent = '❌ Déconnecté';
            }
        }
        
        function clearLogs() {
            document.getElementById('logs').innerHTML = '';
        }
        
        window.onload = function() {
            log('🚀 Page chargée et prête !');
        };
    </script>
</body>
</html>`);
});

// Routes spécifiques pour les tests WebSocket
app.get('/websocket-test.html', (req, res) => {
    res.sendFile('websocket-test.html', { root: '.' });
});

app.get('/websocket-test-simple.html', (req, res) => {
    res.sendFile('websocket-test-simple.html', { root: '.' });
});

app.get('/test-websocket-minimal.html', (req, res) => {
    res.sendFile('test-websocket-minimal.html', { root: '.' });
});

// Configuration WebSocket
setupWebSocket(io, prisma);

// Middleware pour passer io aux routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes API publiques (pour les clients externes)
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

        server.listen(PORT, () => {
            console.log(`🚀 Serveur en cours sur http://localhost:${PORT}`);
            console.log(`📍 Base API: http://localhost:${PORT}/api/v1`);
            console.log(`🔌 WebSocket available on ws://localhost:${PORT}`);
            console.log(`📱 Socket.IO available on http://localhost:${PORT}/socket.io/`);
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
