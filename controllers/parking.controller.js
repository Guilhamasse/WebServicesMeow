// src/controllers/parking.controller.js
import {
createParking,
getLatestParking,
getParkingHistory,
updateParking as updateParkingService,
deleteParking as deleteParkingService,
} from '../services/parking.service.js';

export async function create(req, res) {
    try {
        const { latitude, longitude, address, note } = req.body;
        const parking = await createParking(req.user.id, { latitude, longitude, address, note });
        return res.status(201).json({ message: 'Position enregistrée avec succès', parking });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement:", error);
        return res.status(500).json({ error: 'Erreur serveur', message: "Impossible d'enregistrer la position" });
    }
}

export async function current(req, res) {
    try {
        const parking = await getLatestParking(req.user.id);
        if (!parking) {
            return res.status(404).json({
                error: 'Aucune position trouvée',
                message: "Vous n'avez pas encore enregistré de position",
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
    const limit = parseInt(req.query.limit ?? '50', 10);
        const offset = parseInt(req.query.offset ?? '0', 10);
        const { parkings, total } = await getParkingHistory(req.user.id, limit, offset);

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

export async function update(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const { address, note } = req.body;


        const data = {};
        if (address !== undefined) data.address = address;
        if (note !== undefined) data.note = note;


        const updated = await updateParkingService(req.user.id, id, data);
            if (!updated) {
                return res.status(404).json({
                error: 'Position introuvable',
                message: "Cette position n'existe pas ou ne vous appartient pas",
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
        const id = parseInt(req.params.id, 10);

        const deleted = await deleteParkingService(req.user.id, id);
        if (!deleted) {
            return res.status(404).json({
            error: 'Position introuvable',
            message: "Cette position n'existe pas ou ne vous appartient pas",
        });
        }
        return res.json({ message: 'Position supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        return res.status(500).json({ error: 'Erreur serveur', message: 'Impossible de supprimer la position' });
    }
}

