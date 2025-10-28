import crypto from 'crypto';

/**
 * Génère une clé API sécurisée
 * Format: tk_live_[random-base64-string]
 * @returns {string} Une clé API
 */
export const generateApiKey = () => {
    // Générer 32 bytes aléatoires et les convertir en base64
    const randomBytes = crypto.randomBytes(32);
    const base64Key = randomBytes.toString('base64');
    
    // Ajouter un préfixe pour identifier le type de clé
    return `tk_live_${base64Key}`;
};

/**
 * Valide le format d'une clé API
 * @param {string} apiKey - La clé API à valider
 * @returns {boolean} true si valide, false sinon
 */
export const isValidApiKeyFormat = (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') {
        return false;
    }
    
    // Format: tk_live_[base64-string]
    const pattern = /^tk_live_[A-Za-z0-9+/=]+$/;
    return pattern.test(apiKey);
};