# TrackMe API 🚗

API RESTful pour gérer les emplacements de parking et retrouver une voiture facilement.

**Système simplifié** : Vous créez des utilisateurs avec leurs clés API pour vos clients externes.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Configuration

Créez un fichier `.env` à la racine du projet :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
JWT_SECRET="votre-clé-secrète-jwt"
PORT=3000
```

### Migration de la base de données

```bash
npx prisma migrate dev
```

### Lancer l'API

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

L'API sera disponible sur `http://localhost:3000`

## 🎯 Workflow Simplifié

### 1️⃣ Vous créez un client

```bash
curl -X POST http://localhost:3000/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "name": "Application mobile"
  }'
```

Vous recevez :
```json
{
  "user": {
    "id": 1,
    "email": "client@example.com"
  },
  "apiKey": {
    "key": "tk_live_aBc123XyZ789..."
  },
  "warning": "⚠️ Conservez ces informations en sécurité - Cette clé ne sera affichée qu'une seule fois"
}
```

⚠️ **Important** : La clé en clair ne sera affichée qu'une seule fois lors de la création. Elle est ensuite hashée (SHA-256) et stockée dans la base de données.

### 2️⃣ Vous envoyez la clé API au client

Le client n'a pas besoin de s'inscrire ou se connecter.

### 3️⃣ Le client utilise la clé API

```bash
curl -X POST http://localhost:3000/api/v1/parking \
  -H "X-API-Key: tk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 48.8566,
    "longitude": 2.3522
  }'
```

C'est tout ! 🎉

## 📚 Documentation de l'API

### Base URL
```
http://localhost:3000/api/v1
```

### Routes Administration (`/admin`)

#### POST `/admin/users`
Créer un utilisateur et sa clé API (pour vos clients externes)

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (201):**
```json
{
  "message": "Compte créé avec succès",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGc..."
}
```

#### POST `/auth/login`
Se connecter et recevoir un token JWT

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "message": "Connexion réussie",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z",
    "lastParking": null
  },
  "token": "eyJhbGc..."
}
```

#### GET `/auth/profile`
Récupérer le profil de l'utilisateur connecté

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z",
    "lastParking": {
      "id": 1,
      "latitude": 48.8566,
      "longitude": 2.3522,
      "address": "Rue de Rivoli, Paris",
      "note": "Parking souterrain"
    },
    "parkingsCount": 5
  }
}
```

### Routes parking

#### POST `/parking`
Sauvegarder une nouvelle position GPS

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "address": "Rue de Rivoli, 75001 Paris",
  "note": "Parking souterrain niveau -2"
}
```

**Response (201):**
```json
{
  "message": "Position enregistrée avec succès",
  "parking": {
    "id": 1,
    "user_id": 1,
    "latitude": 48.8566,
    "longitude": 2.3522,
    "address": "Rue de Rivoli, 75001 Paris",
    "note": "Parking souterrain niveau -2",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

#### GET `/parking/current`
Obtenir la dernière position enregistrée

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "parking": {
    "id": 1,
    "user_id": 1,
    "latitude": 48.8566,
    "longitude": 2.3522,
    "address": "Rue de Rivoli, 75001 Paris",
    "note": "Parking souterrain niveau -2",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

#### GET `/parking/history`
Récupérer l'historique complet des positions

**Headers:**
```
Authorization: Bearer <token>
```

**Query params:**
- `limit` (optionnel, défaut: 50) - Nombre de résultats
- `offset` (optionnel, défaut: 0) - Pagination

**Response (200):**
```json
{
  "parkings": [
    {
      "id": 1,
      "latitude": 48.8566,
      "longitude": 2.3522,
      "address": "Rue de Rivoli, Paris",
      "note": "Parking souterrain",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### DELETE `/parking/:id`
Supprimer une position spécifique

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Position supprimée avec succès"
}
```

#### PATCH `/parking/:id`
Modifier une position (adresse ou note uniquement)

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "note": "Nouvelle note",
  "address": "Nouvelle adresse"
}
```

**Response (200):**
```json
{
  "message": "Position mise à jour avec succès",
  "parking": {
    "id": 1,
    "latitude": 48.8566,
    "longitude": 2.3522,
    "address": "Nouvelle adresse touchée",
    "note": "Nouvelle note",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🛠 Stack technique

- **Backend:** Express.js (Node.js)
- **ORM:** Prisma
- **Database:** PostgreSQL (Neon)
- **Auth:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Security:** Helmet, CORS, bcrypt

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt (salt rounds: 10)
- **Clés API hashées avec SHA-256** - Les clés API sont stockées uniquement en hash
- Authentification JWT avec expiration de 7 jours
- Helmet pour sécuriser les headers HTTP
- CORS configuré pour autoriser les requêtes depuis le frontend
- Validation des données d'entrée avec express-validator

## 📝 Validation

### Mot de passe
- Minimum 6 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre

### Coordonnées GPS
- Latitude: entre -90 et 90
- Longitude: entre -180 et 180

## 🗄 Structure de la base de données

### Table `User`
- `id` (INT, PRIMARY KEY)
- `email` (TEXT, UNIQUE)
- `password` (TEXT, hashé)
- `created_at` (TIMESTAMP)

### Table `Parking`
- `id` (INT, PRIMARY KEY)
- `user_id` (INT, FOREIGN KEY -> User.id)
- `latitude` (DOUBLE PRECISION)
- `longitude` (DOUBLE PRECISION)
- `address` (TEXT, nullable)
- `note` (TEXT, nullable)
- `created_at` (TIMESTAMP)

### Table `ApiKey`
- `id` (INT, PRIMARY KEY)
- `user_id` (INT, FOREIGN KEY -> User.id)
- `key_hash` (TEXT, nullable) - Hash SHA-256 de la clé API
- `key_prefix` (TEXT, nullable) - Préfixe de la clé (ex: tk_live_)
- `name` (TEXT, nullable)
- `last_used_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP, nullable)
- `is_active` (BOOLEAN)

## 🧪 Test

### Health Check
```bash
curl http://localhost:3000/health
```

### S'inscrire
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'
```

### Se connecter
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'
```

### Enregistrer une position
```bash
curl -X POST http://localhost:3000/api/v1/parking \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre-token>" \
  -d '{"latitude":48.8566,"longitude":2.3522,"address":"Paris"}'
```

## 📦 Dépendances

### Production
- `express` - Framework web
- `@prisma/client` - Client ORM
- `bcrypt` - Hashage des mots de passe
- `jsonwebtoken` - Authentification JWT
- `helmet` - Sécurité HTTP
- `cors` - Gestion CORS
- `express-validator` - Validation
- `dotenv` - Variables d'environnement

### Développement
- `prisma` - CLI Prisma
- `nodemon` - Rechargement automatique

## 🎯 Fonctionnalités futures

- [ ] Intégration avec Google Maps / Leaflet
- [ ] Notifications après X heures de stationnement
- [ ] Analytics du temps de stationnement
- [ ] Partage de position avec un proche
- [ ] Endpoint pour obtenir les directions retour
- [ ] Documentation Swagger/OpenAPI
