// src/controllers/parking.controller.js
import {
createParking,
getLatestParking,
getParkingHistory,
findOwnedParking,
updateParking as updateParkingService,
deleteParking as deleteParkingService,
} from '../services/parking.service.js';

export async function create(req, res) {
    try {
        const user_id = parseInt(req.params.user_id, 10);
        const { latitude, longitude, address, note } = req.body;
        const parking = await createParking({ user_id, latitude, longitude, address, note });
        return res.status(201).json({ message: 'Position enregistrée avec succès', parking });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement:", error);
        return res.status(500).json({ error: 'Erreur serveur', message: "Impossible d'enregistrer la position" });
    }
}

export async function current(req, res) {
    try {
        const user_id = parseInt(req.params.user_id, 10);
        const parking = await getLatestParking(user_id);
        if (!parking) {
            return res.status(404).json({
                error: 'Aucune position trouvée',
                message: "Aucune position enregistrée pour cet utilisateur",
            });
        }
        return res.json({ parking });
    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        return res.status(500).json({ error: 'Erreur serveur', message: "Impossible de récupérer la dernière position" });
    }
}

export async function history(req, res) {
    try {
        const user_id = parseInt(req.params.user_id, 10);
        const limit = parseInt(req.query.limit ?? '50', 10);
        const offset = parseInt(req.query.offset ?? '0', 10);
        const { parkings, total } = await getParkingHistory(user_id, limit, offset);

        return res.json({
            parkings,
            pagination: {
            total,
            limit,
            offset,
            hasMore: total > offset + limit,
        },
    });
    } catch (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
        return res.status(500).json({ error: 'Erreur serveur', message: "Impossible de récupérer l'historique" });
    }
}

export async function getOne(req, res) {
    try {
        const user_id = parseInt(req.params.user_id, 10);
        const id = parseInt(req.params.id, 10);
        const parking = await findOwnedParking(user_id, id);
        
        if (!parking) {
            return res.status(404).json({
                error: 'Position introuvable',
                message: "Cette position n'existe pas ou n'appartient pas à cet utilisateur",
            });
        }
        return res.json({ parking });
    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        return res.status(500).json({ error: 'Erreur serveur', message: "Impossible de récupérer la position" });
    }
}

export async function update(req, res) {
    try {
        const user_id = parseInt(req.params.user_id, 10);
        const id = parseInt(req.params.id, 10);
        const { address, note } = req.body;

        const data = {};
        if (address !== undefined) data.address = address;
        if (note !== undefined) data.note = note;

        const updated = await updateParkingService(user_id, id, data);
        if (!updated) {
            return res.status(404).json({
                error: 'Position introuvable',
                message: "Cette position n'existe pas ou n'appartient pas à cet utilisateur",
            });
        }

        return res.json({ message: 'Position mise à jour avec succès', parking: updated });
    } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: "Impossible de mettre à jour la position" });
    }
}

export async function destroy(req, res) {
    try {
        const user_id = parseInt(req.params.user_id, 10);
        const id = parseInt(req.params.id, 10);

        const deleted = await deleteParkingService(user_id, id);
        if (!deleted) {
            return res.status(404).json({
            error: 'Position introuvable',
            message: "Cette position n'existe pas ou n'appartient pas à cet utilisateur",
        });
        }
        return res.json({ message: 'Position supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        return res.status(500).json({ error: 'Erreur serveur', message: 'Impossible de supprimer la position' });
    }
}

