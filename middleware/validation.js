import { body, validationResult } from 'express-validator';

/**
 * Middleware pour valider les erreurs de validation
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Erreur de validation',
            details: errors.array()
        });
    }
    next();
};

/**
 * Règles de validation pour l'inscription
 */
export const registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Email invalide')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Le mot de passe doit contenir au moins 6 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
];

/**
 * Règles de validation pour la connexion
 */
export const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Email invalide')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Le mot de passe est requis')
];

/**
 * Règles de validation pour créer un parking
 */
export const parkingValidation = [
    body('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('La latitude doit être entre -90 et 90'),
    body('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('La longitude doit être entre -180 et 180'),
    body('address')
        .optional()
        .isString()
        .withMessage('L\'adresse doit être une chaîne de caractères'),
    body('note')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('La note ne peut pas dépasser 500 caractères')
];

