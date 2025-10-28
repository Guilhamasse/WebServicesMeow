# Guide des Clés API TrackMe 🔑

## Vue d'ensemble

TrackMe utilise un système de clés API pour sécuriser les appels à l'API REST. Chaque utilisateur peut générer plusieurs clés API.

## Fonctionnement

### Format des clés API
Les clés API suivent le format : `tk_live_[random-base64-string]`

Exemple : `tk_live_aBc123XyZ789...`

### Utilisation

#### Headers requis
Toutes les requêtes vers les endpoints protégés doivent inclure :
```
X-API-Key: votre-clé-api-ici
```

#### Exemple avec curl
```bash
curl -X GET http://localhost:3000/api/v1/parking/current \
  -H "X-API-Key: tk_live_aBc123XyZ789..."
```

#### Exemple avec JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:3000/api/v1/parking/current', {
  headers: {
    'X-API-Key': 'tk_live_aBc123XyZ789...',
    'Content-Type': 'application/json'
  }
});
```

## Création et gestion des clés API

### 1. Créer une clé API

**Endpoint:** `POST /api/v1/api-keys`

**Authentification:** JWT (via login/register)

**Request:**
```json
{
  "name": "Clé API mobile",
  "expires_in_days": 365
}
```

**Response:**
```json
{
  "message": "Clé API créée avec succès",
  "apiKey": {
    "id": 1,
    "key": "tk_live_aBc123XyZ789...",
    "name": "Clé API mobile",
    "created_at": "2024-01-01T00:00:00.000Z",
    "expires_at": "2025-01-01T00:00:00.000Z"
  },
  "warning": "⚠️ Conservez cette clé en sécurité, elle ne sera plus affichée après cette réponse"
}
```

### 2. Lister vos clés API

**Endpoint:** `GET /api/v1/api-keys`

**Authentification:** JWT

**Response:**
```json
{
  "apiKeys": [
    {
      "id": 1,
      "key": "tk_live_aBc123...xyz789",
      "name": "Clé API mobile",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "last_used_at": "2024-01-15T10:30:00.000Z",
      "expires_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

⚠️ Note : Les clés sont masquées dans la liste (seuls les premiers et derniers caractères sont affichés).

### 3. Désactiver une clé API

**Endpoint:** `DELETE /api/v1/api-keys/:id`

**Authentification:** JWT

**Response:**
```json
{
  "message": "Clé API désactivée avec succès"
}
```

## Endpoints protégés par clé API

Les routes suivantes nécessitent une clé API valide :

### Parking

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/parking` | Enregistrer une position |
| GET | `/api/v1/parking/current` | Dernière position |
| GET | `/api/v1/parking/history` | Historique complet |
| DELETE | `/api/v1/parking/:id` | Supprimer une position |
| PATCH | `/api/v1/parking/:id` | Modifier une position |

## Vérification des clés API

Le middleware vérifie automatiquement :

1. ✅ **Présence** - La clé est fournie dans `X-API-Key`
2. ✅ **Validité** - La clé existe dans la base de données
3. ✅ **Activation** - La clé n'est pas désactivée (`is_active: true`)
4. ✅ **Expiration** - La clé n'a pas expiré (`expires_at`)

En cas d'échec, une erreur 401 ou 403 est renvoyée :

```json
{
  "error": "Clé API invalide",
  "message": "La clé API fournie est invalide"
}
```

## Cas d'usage

### 1. Application mobile

```javascript
// Générer une clé API via le dashboard web
const API_KEY = 'tk_live_mobile_key_123';

// Utiliser dans l'app mobile
async function saveParkingLocation(lat, lng) {
  const response = await fetch('https://api.trackme.com/api/v1/parking', {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      latitude: lat,
      longitude: lng,
      note: 'Au travail'
    })
  });
  
  return response.json();
}
```

### 2. Intégration tiers

```bash
# Une application externe utilise votre API
curl -X GET "https://api.trackme.com/api/v1/parking/history?limit=10" \
  -H "X-API-Key: tk_live_integration_xyz"
```

### 3. Rotation des clés

```javascript
// Créer une nouvelle clé
const newKey = await createApiKey({ name: 'Nouvelle clé' });

// Mettre à jour l'application
const API_KEY = newKey.apiKey.key;

// Désactiver l'ancienne clé
await deleteApiKey(oldKeyId);
```

## Bonnes pratiques

### ✅ À faire

- **Conservez vos clés en sécurité** - Ne les partagez jamais publiquement
- **Utilisez des noms descriptifs** - "App iOS", "Intégration Slack", etc.
- **Définissez des dates d'expiration** - Pour limiter l'impact en cas de fuite
- **Utilisez des clés différentes** - Une clé par application/service
- **Désactivez les clés inutilisées** - Nettoyez régulièrement

### ❌ À éviter

- ❌ Commiter des clés dans Git
- ❌ Partager des clés dans des emails non sécurisés
- ❌ Utiliser la même clé partout
- ❌ Garder des clés expirées actives
- ❌ Stocker des clés côté client dans du code JavaScript non minifié

## Sécurité

### Infrastructure

- Les clés sont stockées en hachage dans la base de données
- Chaque clé est unique (contrainte `@unique`)
- Support des dates d'expiration
- Possibilité de désactiver une clé sans la supprimer

### Traçabilité

- `last_used_at` : Dernière utilisation de la clé
- `created_at` : Date de création
- Journal des accès (si activé)

## Workflow complet

1. **S'inscrire ou se connecter** via `/auth/register` ou `/auth/login`
2. **Générer une clé API** via `/api-keys` avec le token JWT
3. **Copier la clé** (elle ne sera plus affichée après)
4. **Utiliser la clé** dans toutes les requêtes vers les endpoints parking
5. **Gérer les clés** via les endpoints `/api-keys`

## Dépannage

### Erreur : "Clé API manquante"
```json
{
  "error": "Clé API manquante",
  "message": "Veuillez fournir une clé API dans le header X-API-Key"
}
```
**Solution :** Ajoutez le header `X-API-Key` dans votre requête

### Erreur : "Clé API invalide"
**Solution :** Vérifiez que la clé est correcte et active

### Erreur : "Clé API expirée"
**Solution :** Générez une nouvelle clé API

### Erreur : "Clé API désactivée"
**Solution :** La clé a été désactivée manuellement. Créez-en une nouvelle.

## Exemples complets

Voir le fichier `test-api-key.http` pour des exemples de requêtes complètes.

