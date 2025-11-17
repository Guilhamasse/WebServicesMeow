import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WebServices Meow API',
      version: '1.0.0',
      description: 'API de gestion de stationnements avec authentification et gestion d\'utilisateurs',
      contact: {
        name: 'WebServices Meow',
        email: 'contact@webservicesmeow.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /auth/login',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Clé API pour l\'authentification',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de l\'utilisateur',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de l\'utilisateur',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création du compte',
            },
          },
        },
        Parking: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique du stationnement',
            },
            user_id: {
              type: 'integer',
              description: 'ID de l\'utilisateur propriétaire',
            },
            latitude: {
              type: 'number',
              format: 'float',
              description: 'Latitude GPS',
            },
            longitude: {
              type: 'number',
              format: 'float',
              description: 'Longitude GPS',
            },
            address: {
              type: 'string',
              description: 'Adresse du stationnement',
              nullable: true,
            },
            note: {
              type: 'string',
              description: 'Note ou commentaire',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création',
            },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de la clé API',
            },
            user_id: {
              type: 'integer',
              description: 'ID de l\'utilisateur propriétaire',
            },
            key: {
              type: 'string',
              description: 'Clé API générée',
            },
            name: {
              type: 'string',
              description: 'Nom de la clé API',
              nullable: true,
            },
            last_used_at: {
              type: 'string',
              format: 'date-time',
              description: 'Dernière utilisation',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création',
            },
            expires_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date d\'expiration',
              nullable: true,
            },
            is_active: {
              type: 'boolean',
              description: 'Statut actif/inactif',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Message d\'erreur',
            },
            details: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Détails supplémentaires de l\'erreur',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Mot de passe (minimum 6 caractères)',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Mot de passe (minimum 6 caractères)',
            },
          },
        },
        ParkingRequest: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            latitude: {
              type: 'number',
              format: 'float',
              minimum: -90,
              maximum: 90,
              description: 'Latitude GPS (-90 à 90)',
            },
            longitude: {
              type: 'number',
              format: 'float',
              minimum: -180,
              maximum: 180,
              description: 'Longitude GPS (-180 à 180)',
            },
            address: {
              type: 'string',
              description: 'Adresse du stationnement',
            },
            note: {
              type: 'string',
              description: 'Note ou commentaire',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Opérations d\'authentification et de gestion des utilisateurs',
      },
      {
        name: 'Parking',
        description: 'Gestion des stationnements',
      },
      {
        name: 'Admin',
        description: 'Opérations d\'administration (nécessite une clé API)',
      },
    ],
  },
  apis: ['./routes/*.js', './server.js'], // Chemins vers les fichiers contenant les annotations
};

export const specs = swaggerJsdoc(options);