import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createParking({ user_id, latitude, longitude, address, note }) {
    return prisma.parking.create({
        data: { user_id, latitude, longitude, address, note },
    });
}


export async function getLatestParking(userId) {
    return prisma.parking.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
    });
}


export async function getParkingHistory(userId, limit = 50, offset = 0) {
    const [parkings, total] = await Promise.all([
        prisma.parking.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.parking.count({ where: { user_id: userId } }),
    ]);

    return { parkings, total };
}


export async function findOwnedParking(userId, id) {
    return prisma.parking.findFirst({ where: { id, user_id: userId } });
}


export async function updateParking(userId, id, data) {
    const exists = await findOwnedParking(userId, id);
    if (!exists) return null;

    return prisma.parking.update({ where: { id }, data });
}


export async function deleteParking(userId, id) {
    const exists = await findOwnedParking(userId, id);
    if (!exists) return false;

    await prisma.parking.delete({ where: { id } });
    return true;
}