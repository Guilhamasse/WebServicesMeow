import jwt from 'jsonwebtoken';

// Map pour stocker les timers actifs par utilisateur
const activeTimers = new Map();

/**
 * Configuration du serveur WebSocket
 */
export function setupWebSocket(io, prisma) {
    console.log('🔌 Configuration WebSocket initialisée');
    
    // Middleware d'authentification pour les WebSockets
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return next(new Error('Token d\'authentification manquant'));
            }

            // Vérifier le token JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Récupérer l'utilisateur depuis la base de données
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true
                }
            });

            if (!user) {
                return next(new Error('Utilisateur introuvable'));
            }

            socket.userId = user.id;
            socket.userEmail = user.email;
            next();
        } catch (error) {
            console.error('❌ Erreur d\'authentification WebSocket:', error.message);
            next(new Error('Token invalide'));
        }
    });

    // Gestion des connexions WebSocket
    io.on('connection', (socket) => {
        console.log(`✅ Utilisateur connecté: ${socket.userEmail} (ID: ${socket.userId})`);
        
        // Rejoindre une room spécifique à l'utilisateur
        socket.join(`user_${socket.userId}`);
        
        // Envoyer un message de bienvenue
        socket.emit('connected', {
            message: 'Connexion WebSocket établie',
            userId: socket.userId,
            email: socket.userEmail,
            timestamp: new Date().toISOString()
        });

        // Gestionnaire pour démarrer un chronomètre de parking
        socket.on('start_parking_timer', async (data) => {
            try {
                const { parkingId, duration = 10 } = data; // durée en secondes (défaut: 10s)
                
                console.log(`⏱️ Démarrage chronomètre pour l'utilisateur ${socket.userId}, parking ${parkingId}, durée: ${duration}s`);
                
                // Vérifier que le parking appartient à l'utilisateur
                const parking = await prisma.parking.findFirst({
                    where: {
                        id: parseInt(parkingId),
                        user_id: socket.userId
                    }
                });

                if (!parking) {
                    socket.emit('timer_error', {
                        error: 'Parking introuvable ou non autorisé',
                        parkingId,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                // Annuler le timer précédent s'il existe
                const existingTimer = activeTimers.get(socket.userId);
                if (existingTimer) {
                    clearTimeout(existingTimer.timeoutId);
                    console.log(`🔄 Timer précédent annulé pour l'utilisateur ${socket.userId}`);
                }

                // Confirmer le démarrage du timer
                socket.emit('timer_started', {
                    message: 'Chronomètre démarré',
                    parkingId,
                    duration,
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + duration * 1000).toISOString()
                });

                // Programmer la notification
                const timeoutId = setTimeout(async () => {
                    try {
                        // Mettre à jour le parking pour marquer la fin du temps
                        await prisma.parking.update({
                            where: { id: parseInt(parkingId) },
                            data: {
                                note: parking.note ? `${parking.note} - Temps écoulé à ${new Date().toLocaleTimeString()}` : `Temps écoulé à ${new Date().toLocaleTimeString()}`
                            }
                        });

                        // Envoyer la notification
                        io.to(`user_${socket.userId}`).emit('parking_time_expired', {
                            message: '⏰ Temps de stationnement écoulé !',
                            parkingId,
                            location: parking.address || `${parking.latitude}, ${parking.longitude}`,
                            duration,
                            expiredAt: new Date().toISOString(),
                            recommendations: [
                                'Vérifiez si vous devez déplacer votre véhicule',
                                'Considérez prolonger votre stationnement si possible',
                                'Attention aux contraventions'
                            ]
                        });

                        console.log(`🚨 Notification envoyée à l'utilisateur ${socket.userId} pour le parking ${parkingId}`);
                        
                        // Supprimer le timer de la map
                        activeTimers.delete(socket.userId);
                        
                    } catch (error) {
                        console.error('❌ Erreur lors de la notification:', error);
                        io.to(`user_${socket.userId}`).emit('timer_error', {
                            error: 'Erreur lors de la notification',
                            parkingId,
                            timestamp: new Date().toISOString()
                        });
                    }
                }, duration * 1000);

                // Stocker le timer actif
                activeTimers.set(socket.userId, {
                    timeoutId,
                    parkingId,
                    duration,
                    startTime: new Date(),
                    socketId: socket.id
                });

            } catch (error) {
                console.error('❌ Erreur lors du démarrage du timer:', error);
                socket.emit('timer_error', {
                    error: 'Erreur lors du démarrage du chronomètre',
                    details: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Gestionnaire pour annuler un chronomètre
        socket.on('cancel_parking_timer', () => {
            const timer = activeTimers.get(socket.userId);
            if (timer) {
                clearTimeout(timer.timeoutId);
                activeTimers.delete(socket.userId);
                
                socket.emit('timer_cancelled', {
                    message: 'Chronomètre annulé',
                    parkingId: timer.parkingId,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`❌ Timer annulé pour l'utilisateur ${socket.userId}`);
            } else {
                socket.emit('timer_error', {
                    error: 'Aucun chronomètre actif à annuler',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Gestionnaire pour obtenir le statut du timer
        socket.on('get_timer_status', () => {
            const timer = activeTimers.get(socket.userId);
            if (timer) {
                const elapsed = Math.floor((new Date() - timer.startTime) / 1000);
                const remaining = Math.max(0, timer.duration - elapsed);
                
                socket.emit('timer_status', {
                    active: true,
                    parkingId: timer.parkingId,
                    duration: timer.duration,
                    elapsed,
                    remaining,
                    startTime: timer.startTime.toISOString()
                });
            } else {
                socket.emit('timer_status', {
                    active: false,
                    message: 'Aucun chronomètre actif'
                });
            }
        });

        // Gestion des déconnexions
        socket.on('disconnect', (reason) => {
            console.log(`❌ Utilisateur déconnecté: ${socket.userEmail} (${reason})`);
            
            // Ne pas annuler le timer lors de la déconnexion
            // Le timer continue même si l'utilisateur se déconnecte
            const timer = activeTimers.get(socket.userId);
            if (timer) {
                console.log(`⏱️ Timer continue à s'exécuter pour l'utilisateur ${socket.userId} malgré la déconnexion`);
            }
        });

        // Gestionnaire d'erreur
        socket.on('error', (error) => {
            console.error(`❌ Erreur WebSocket pour l'utilisateur ${socket.userId}:`, error);
        });
    });

    // Fonction utilitaire pour envoyer des notifications à tous les utilisateurs (admin)
    io.sendNotificationToUser = (userId, notification) => {
        io.to(`user_${userId}`).emit('notification', {
            ...notification,
            timestamp: new Date().toISOString()
        });
    };

    // Fonction utilitaire pour obtenir les stats des timers actifs
    io.getActiveTimersStats = () => {
        return {
            activeTimers: activeTimers.size,
            timers: Array.from(activeTimers.entries()).map(([userId, timer]) => ({
                userId,
                parkingId: timer.parkingId,
                duration: timer.duration,
                startTime: timer.startTime,
                socketId: timer.socketId
            }))
        };
    };
}

export { activeTimers };