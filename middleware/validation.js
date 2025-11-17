import { z } from "zod";

/**
 * Middleware générique pour valider req.body avec un schéma Zod
 */
export const validateWithSchema = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse(req.body); 
        req.body = parsed; // Nettoyé & validé ✔️
        next();
    } catch (err) {
        return res.status(400).json({
            error: "Erreur de validation",
            details: err.errors,
        });
    }
};

/* -------------------------------------------------------------------------- */
/*                               🔐 AUTH SCHEMAS                               */
/* -------------------------------------------------------------------------- */

export const registerSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z
        .string()
        .min(6, "Le mot de passe doit contenir au moins 6 caractères")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
        ),
});

export const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Le mot de passe est requis"),
});

/* -------------------------------------------------------------------------- */
/*                          🚗 PARKING VALIDATION SCHEMA                      */
/* -------------------------------------------------------------------------- */

export const parkingSchema = z.object({
    latitude: z
        .number({
            invalid_type_error: "La latitude doit être un nombre",
        })
        .min(-90, "La latitude doit être ≥ -90")
        .max(90, "La latitude doit être ≤ 90"),

    longitude: z
        .number({
            invalid_type_error: "La longitude doit être un nombre",
        })
        .min(-180, "La longitude doit être ≥ -180")
        .max(180, "La longitude doit être ≤ 180"),

    address: z.string().optional(),
    note: z.string().max(500, "La note ne peut pas dépasser 500 caractères").optional(),
});

/* -------------------------------------------------------------------------- */
/*                          👑   ADMIN VALIDATION SCHEMAS                     */
/* -------------------------------------------------------------------------- */

export const adminCreateUserSchema = z.object({
    email: z.string().email("Email invalide"),
    name: z.string().min(1, "Le nom est requis"),
    expires_in_days: z
        .number({
            invalid_type_error: "expires_in_days doit être un nombre"
        })
        .min(1, "La durée doit être au minimum 1 jour")
});
    
export const adminApiKeySchema = z.object({
    name: z.string().min(1, "Le nom de la clé est requis"),
    expires_in_days: z
        .number({
            invalid_type_error: "expires_in_days doit être un nombre"
        })
        .min(1, "La durée doit être au minimum 1 jour")
});
