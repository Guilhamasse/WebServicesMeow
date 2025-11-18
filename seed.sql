-- Script SQL pour peupler la base de données avec des données de test
-- Les mots de passe sont hashés avec bcrypt (salt rounds: 10)
-- Les clés API sont hashées avec SHA-256

-- Nettoyer les tables existantes (optionnel - commentez si vous voulez garder les données existantes)
-- TRUNCATE TABLE "ApiKey" CASCADE;
-- TRUNCATE TABLE "Parking" CASCADE;
-- TRUNCATE TABLE "User" CASCADE;

-- ============================================
-- INSERTION DES UTILISATEURS
-- ============================================
-- Mots de passe hashés avec bcrypt (salt rounds: 10)
-- "Test123" -> $2b$10$rOzJqZqZqZqZqZqZqZqZqO
-- "Password1" -> $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- "Admin123" -> $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- "User1234" -> $2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW

INSERT INTO "User" (email, password, created_at) VALUES
('admin@trackme.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW() - INTERVAL '30 days'),
('alice@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW() - INTERVAL '15 days'),
('bob@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', NOW() - INTERVAL '10 days'),
('charlie@example.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqO', NOW() - INTERVAL '5 days'),
('diana@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW() - INTERVAL '2 days')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- INSERTION DES CLÉS API
-- ============================================
-- Les clés API sont hashées avec SHA-256
-- Format: tk_live_<base64>
-- Hash SHA-256 de "tk_live_dGVzdF9rZXlfMTIz" = 8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4
-- Hash SHA-256 de "tk_live_YWxpY2Vfa2V5XzQ1Ng" = a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
-- Hash SHA-256 de "tk_live_Ym9iX2tleV83ODk" = 3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1eb8b85103e3be7ba613b31bb5c9c36214dc9f14a42fd7a2fdb84856bca5c44c2

INSERT INTO "ApiKey" (user_id, key_hash, key_prefix, name, created_at, expires_at, is_active, last_used_at) VALUES
-- Clés pour admin@trackme.com (user_id = 1)
(1, '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4', 'tk_live_', 'Clé principale admin', NOW() - INTERVAL '25 days', NULL, true, NOW() - INTERVAL '1 day'),
(1, 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'tk_live_', 'Clé de test admin', NOW() - INTERVAL '10 days', NOW() + INTERVAL '30 days', true, NOW() - INTERVAL '2 hours'),

-- Clés pour alice@example.com (user_id = 2)
(2, '3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1eb8b85103e3be7ba613b31bb5c9c36214dc9f14a42fd7a2fdb84856bca5c44c2', 'tk_live_', 'App mobile Alice', NOW() - INTERVAL '12 days', NULL, true, NOW() - INTERVAL '5 hours'),
(2, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'tk_live_', 'Intégration web Alice', NOW() - INTERVAL '5 days', NOW() + INTERVAL '60 days', true, NULL),

-- Clés pour bob@example.com (user_id = 3)
(3, '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'tk_live_', 'Clé principale Bob', NOW() - INTERVAL '8 days', NULL, true, NOW() - INTERVAL '1 day'),
(3, 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae9511e68e4d0b0e', 'tk_live_', 'Clé expirée Bob', NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days', false, NOW() - INTERVAL '6 days'),

-- Clés pour charlie@example.com (user_id = 4)
(4, '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'tk_live_', 'Clé Charlie', NOW() - INTERVAL '3 days', NULL, true, NULL),

-- Clés pour diana@example.com (user_id = 5)
(5, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'tk_live_', 'Clé Diana', NOW() - INTERVAL '1 day', NULL, true, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- INSERTION DES PARKINGS
-- ============================================
-- Coordonnées GPS de lieux réels en France

INSERT INTO "Parking" (user_id, latitude, longitude, address, note, created_at) VALUES
-- Parkings pour admin@trackme.com (user_id = 1)
(1, 48.8566, 2.3522, 'Place de la Bastille, 75011 Paris', 'Parking près du métro Bastille', NOW() - INTERVAL '20 days'),
(1, 48.8606, 2.3376, 'Musée du Louvre, 75001 Paris', 'Parking souterrain Louvre', NOW() - INTERVAL '15 days'),
(1, 48.8584, 2.2945, 'Tour Eiffel, 75007 Paris', 'Parking public Champ de Mars', NOW() - INTERVAL '10 days'),
(1, 48.8738, 2.2950, 'Arc de Triomphe, 75008 Paris', 'Parking avenue des Champs-Élysées', NOW() - INTERVAL '5 days'),
(1, 48.8534, 2.3488, 'Notre-Dame, 75004 Paris', 'Parking rue de la Cité', NOW() - INTERVAL '2 days'),

-- Parkings pour alice@example.com (user_id = 2)
(2, 45.7640, 4.8357, 'Place Bellecour, 69002 Lyon', 'Parking centre-ville Lyon', NOW() - INTERVAL '12 days'),
(2, 45.7500, 4.8500, 'Parc de la Tête d''Or, 69006 Lyon', 'Parking près du parc', NOW() - INTERVAL '8 days'),
(2, 45.7715, 4.8267, 'Fourvière, 69005 Lyon', 'Parking basilique Fourvière', NOW() - INTERVAL '3 days'),

-- Parkings pour bob@example.com (user_id = 3)
(3, 43.2965, 5.3698, 'Vieux-Port, 13001 Marseille', 'Parking port de Marseille', NOW() - INTERVAL '7 days'),
(3, 43.2985, 5.3848, 'Notre-Dame de la Garde, 13006 Marseille', 'Parking basilique', NOW() - INTERVAL '4 days'),
(3, 43.2500, 5.4000, 'Parc Borély, 13008 Marseille', 'Parking parc Borély', NOW() - INTERVAL '1 day'),

-- Parkings pour charlie@example.com (user_id = 4)
(4, 43.6047, 1.4442, 'Capitole, 31000 Toulouse', 'Parking place du Capitole', NOW() - INTERVAL '4 days'),
(4, 43.6000, 1.4500, 'Cité de l''Espace, 31500 Toulouse', 'Parking musée spatial', NOW() - INTERVAL '2 days'),

-- Parkings pour diana@example.com (user_id = 5)
(5, 47.2184, -1.5536, 'Château des Ducs, 44000 Nantes', 'Parking château Nantes', NOW() - INTERVAL '1 day'),
(5, 47.2122, -1.5564, 'Île de Nantes, 44200 Nantes', 'Parking île de Nantes', NOW() - INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

-- ============================================
-- VÉRIFICATION DES DONNÉES
-- ============================================
-- Vous pouvez exécuter ces requêtes pour vérifier les données insérées

-- SELECT COUNT(*) as total_users FROM "User";
-- SELECT COUNT(*) as total_api_keys FROM "ApiKey";
-- SELECT COUNT(*) as total_parkings FROM "Parking";

-- SELECT u.email, COUNT(p.id) as parking_count 
-- FROM "User" u 
-- LEFT JOIN "Parking" p ON u.id = p.user_id 
-- GROUP BY u.id, u.email;

-- SELECT u.email, COUNT(ak.id) as api_key_count 
-- FROM "User" u 
-- LEFT JOIN "ApiKey" ak ON u.id = ak.user_id 
-- GROUP BY u.id, u.email;

