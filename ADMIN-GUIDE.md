# Guide Administration TrackMe 🔧

## Vue d'ensemble

TrackMe est un web service simplifié où vous (le propriétaire) créez des utilisateurs avec leurs clés API pour vos clients externes.

## Workflow

### 1. Vous créez un utilisateur + clé API pour un client

**Endpoint:** `POST /admin/users`

**Request:**
```json
{
  "email": "client@example.com",
  "name": "Clé pour l'application mobile",
  "expires_in_days": 365
}
```

**Response:**
```json
{
  "message": "Utilisateur et clé API créés avec succès",
  "user": {
    "id": 1,
    "email": "client@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "apiKey": {
    "key": "tk_live_aBc123XyZ789...",
    "name": "Clé pour l'application mobile",
    "created_at": "2024-01-01T00:00:00.000Z",
    "expires_at": "2025-01-01T00:00:00.000Z"
  },
  "warning": "⚠️ Conservez ces informations en sécurité"
}
```

### 2. Vous envoyez la clé API à votre client

Envoyez uniquement :
- La clé API
- La base URL de l'API
- Un exemple de requête

### 3. Le client utilise uniquement la clé API

Pas besoin de s'inscrire, se connecter, ni gérer quoi que ce soit. Il utilise juste :

```
X-API-Key: tk_live_aBc123XyZ789...
```

## Endpoints Admin

### Créer un utilisateur + clé API

```bash
POST /admin/users
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| email | string | Oui | Email du client |
| name | string | Non | Nom de la clé |
| expires_in_days | integer | Non | Durée de validité en jours |

### Lister tous les utilisateurs

```bash
GET /admin/users
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "client@example.com",
      "created_at": "2024-01-01T00:00:00.000Z",
      "apiKeysCount": 1,
      "parkingsCount": 5,
      "apiKeys": [
        {
          "id": 1,
          "key": "tk_live_aBc123...xyz789",
          "name": "Clé pour l'application mobile",
          "is_active": true,
          "created_at": "2024-01-01T00:00:00.000Z",
          "last_used_at": "2024-01-15T10:30:00.000Z",
          "expires_at": "2025-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "total": 1
}
```

### Créer une clé API supplémentaire

```bash
POST /admin/users/:id/api-keys
```

Utile si un client a besoin de plusieurs clés (ex: clé pour dev, clé pour prod).

### Désactiver une clé API

```bash
DELETE /admin/api-keys/:id
```

La clé est désactivée mais pas supprimée (pour l'historique).

## Endpoints Client (avec clé API)

### Enregistrer une position

```bash
POST /api/v1/parking
X-API-Key: tk_live_...

{
  "user_id": 1,
  "latitude": 48.8566,
  "longitude": 2.3522,
  "address": "Rue de Rivoli, Paris",
  "note": "Parking niveau -2"
}
```

**Note:** Le `user_id` est requis dans le body. C'est un identifiant métier envoyé par le client pour identifier l'utilisateur final.

### Récupérer la dernière position

```bash
GET /api/v1/parking/current?user_id=1
X-API-Key: tk_live_...
```

**Note:** Le paramètre `user_id` est requis dans la query string.

### Historique des positions

```bash
GET /api/v1/parking/history?user_id=1
X-API-Key: tk_live_...

# Avec pagination
GET /api/v1/parking/history?user_id=1&limit=10&offset=0
X-API-Key: tk_live_...
```

**Note:** Le paramètre `user_id` est requis dans la query string.

### Supprimer une position

```bash
DELETE /api/v1/parking/:user_id/:id
X-API-Key: tk_live_...
```

**Note:** Les paramètres `user_id` et `id` sont requis dans l'URL.

### Modifier une position

```bash
PATCH /api/v1/parking/:user_id/:id
X-API-Key: tk_live_...

{
  "note": "Nouvelle note",
  "address": "Nouvelle adresse"
}
```

**Note:** Les paramètres `user_id` et `id` sont requis dans l'URL. Le body contient uniquement les champs à modifier (address et/ou note).

## Exemples complets

### Pour vous (admin)

```bash
# 1. Créer un client
curl -X POST http://localhost:3000/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "name": "Application mobile iOS",
    "expires_in_days": 365
  }'

# 2. Lister tous vos clients
curl -X GET http://localhost:3000/admin/users

# 3. Désactiver une clé si nécessaire
curl -X DELETE http://localhost:3000/admin/api-keys/1
```

### Pour votre client

```bash
# Enregistrer une position
curl -X POST http://localhost:3000/api/v1/parking \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tk_live_..." \
  -d '{
    "user_id": 1,
    "latitude": 48.8566,
    "longitude": 2.3522,
    "address": "Paris"
  }'

# Récupérer la dernière position
curl -X GET "http://localhost:3000/api/v1/parking/current?user_id=1" \
  -H "X-API-Key: tk_live_..."
```

## Données envoyées aux clients

Quand vous créez un compte pour un client, envoyez-lui :

```markdown
# Vos identifiants TrackMe

**Clé API:** tk_live_aBc123XyZ789...

**Base URL:** https://api.trackme.com/api/v1

## Utilisation

Toutes les requêtes doivent inclure le header :
```
X-API-Key: tk_live_aBc123XyZ789...
```

**Important:** Vous devez également envoyer le `user_id` dans chaque requête :
- Dans le **body** pour POST et PATCH
- Dans la **query string** pour GET et DELETE

## Exemple

Enregistrer une position :
```bash
curl -X POST https://api.trackme.com/api/v1/parking \
  -H "X-API-Key: tk_live_aBc123XyZ789..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "latitude": 48.8566,
    "longitude": 2.3522
  }'
```

Récupérer la dernière position :
```bash
curl -X GET "https://api.trackme.com/api/v1/parking/current?user_id=1" \
  -H "X-API-Key: tk_live_aBc123XyZ789..."
```

📖 Documentation complète : https://docs.trackme.com
```

## Avantages de ce système

✅ **Simple pour le client** - Pas d'inscription, pas de mot de passe à gérer  
✅ **Sécurisé** - Clés API uniques et traçables  
✅ **Contrôle total** - Vous créez et gérez tous les accès  
✅ **Traçabilité** - Vous voyez qui utilise quoi et quand  
✅ **Expiration** - Possibilité de définir des durées de validité  
✅ **Désactivation facile** - Couper l'accès en un clic  
✅ **Flexible** - Gestion souple des clés API indépendantes

**Note importante:** Les clés API servent à authentifier l'accès à l'API. Le `user_id` est un paramètre métier envoyé par le client dans chaque requête pour identifier l'utilisateur final.  

## Sécurité des endpoints admin

⚠️ **Important** : Les endpoints `/admin/*` ne sont pas protégés par défaut.

Vous devriez :
- Ajouter une authentification (JWT ou autre) sur ces routes
- Ou les protéger avec un firewall/IP whitelist
- Ou les déployer uniquement en interne

Exemple d'ajout de protection basique :

```javascript
// Dans routes/admin.js
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-me-in-production';

const checkAdminAuth = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (token === ADMIN_TOKEN) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Appliquer points each route
router.post('/users', checkAdminAuth, createUserValidation, async (req, res) => {
    // ...
});
```

Puis dans `.env` :
```
ADMIN_TOKEN=your-super-secret-admin-token
```

## Statistiques

Vous pouvez facilement suivre l'utilisation :

```bash
# Voir tous les clients et leur utilisation
curl http://localhost:3000/admin/users

# Pour chaque client :
# - Nombre de clés API
# - Nombre de positions enregistrées
# - Dernière utilisation
```

