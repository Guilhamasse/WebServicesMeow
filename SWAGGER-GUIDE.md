# Documentation Swagger - WebServices Meow API

## 🎯 Accès à la documentation

Une fois votre serveur démarré, accédez à la documentation interactive Swagger à l'adresse :

**http://localhost:3000/api-docs**

## 📚 Fonctionnalités de la documentation Swagger

### ✅ Ce qui est inclus :

1. **Documentation complète de tous les endpoints**
   - Authentification (`/api/v1/auth`)
   - Gestion des stationnements (`/api/v1/parking`)
   - Administration (`/admin`)

2. **Schémas de données détaillés**
   - User, Parking, ApiKey
   - Requêtes et réponses avec exemples

3. **Interface interactive**
   - Testez les endpoints directement depuis l'interface
   - Authentification intégrée (JWT et API Key)
   - Exemples de requêtes et réponses

4. **Documentation de sécurité**
   - Bearer Token (JWT)
   - API Key Authentication

## 🔧 Comment utiliser Swagger UI

### 1. **Tester l'authentification** 
   1. Allez dans la section "Authentication"
   2. Utilisez `POST /api/v1/auth/register` ou `POST /api/v1/auth/login`
   3. Copiez le token JWT retourné
   4. Cliquez sur "Authorize" en haut à droite
   5. Entrez `Bearer <votre-token>` dans le champ BearerAuth

### 2. **Tester avec une clé API**
   1. Créez un utilisateur via `/admin/users` (nécessite une clé admin)
   2. Récupérez la clé API générée
   3. Cliquez sur "Authorize"
   4. Entrez votre clé API dans le champ ApiKeyAuth

### 3. **Tester les endpoints de stationnement**
   - Une fois authentifié, tous les endpoints seront disponibles
   - Les exemples de données sont pré-remplis
   - Modifiez les valeurs selon vos besoins

## 🚀 Démarrage rapide

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Démarrer le serveur de développement
npm run dev

# Accéder à la documentation
# Ouvrez http://localhost:3000/api-docs dans votre navigateur
```

## 📋 Endpoints documentés

### Authentication
- `POST /api/v1/auth/register` - Créer un compte
- `POST /api/v1/auth/login` - Se connecter
- `GET /api/v1/auth/profile` - Profil utilisateur

### Parking
- `POST /api/v1/parking` - Enregistrer une position
- `GET /api/v1/parking/current` - Dernière position
- `GET /api/v1/parking/history` - Historique
- `DELETE /api/v1/parking/{id}` - Supprimer
- `PATCH /api/v1/parking/{id}` - Modifier

### Admin
- `POST /admin/users` - Créer un utilisateur avec clé API

## 🔐 Authentification dans Swagger

### Option 1: JWT Bearer Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Option 2: API Key
```
X-API-Key: votre-cle-api-ici
```

## 💡 Conseils d'utilisation

1. **Persistance des authentifications** : Swagger UI garde vos tokens en mémoire pendant la session
2. **Exemples interactifs** : Tous les exemples peuvent être modifiés avant l'envoi
3. **Réponses détaillées** : Chaque endpoint montre toutes les réponses possibles (200, 401, 404, etc.)
4. **Validation automatique** : Les schémas valident automatiquement vos données

## 📝 Personnalisation

Pour modifier la documentation :

1. **Schémas** : Éditez `swagger.config.js`
2. **Endpoints** : Ajoutez des commentaires `@swagger` dans vos routes
3. **Styles** : Modifiez les options dans `server.js`

## 🛠️ Maintenance

La documentation Swagger est générée automatiquement à partir :
- Des commentaires JSDoc dans le code
- Des schémas définis dans `swagger.config.js`
- Des routes dans les fichiers `routes/*.js`

Toute modification du code sera automatiquement reflétée dans la documentation !

---

*Développé avec ❤️ pour WebServices Meow*