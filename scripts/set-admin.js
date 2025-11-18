// Script pour définir un utilisateur comme administrateur
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function setAdmin(userIdOrEmail) {
    try {
        // Déterminer si c'est un ID ou un email
        const isEmail = userIdOrEmail.includes('@');
        
        const user = isEmail
            ? await prisma.user.findUnique({ where: { email: userIdOrEmail } })
            : await prisma.user.findUnique({ where: { id: parseInt(userIdOrEmail) } });

        if (!user) {
            console.error(`❌ Utilisateur introuvable: ${userIdOrEmail}`);
            process.exit(1);
        }

        // Mettre à jour le rôle
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'admin' },
            select: { id: true, email: true, role: true }
        });

        console.log('\n✅ Utilisateur défini comme administrateur!\n');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`ID: ${updatedUser.id}`);
        console.log(`Email: ${updatedUser.email}`);
        console.log(`Rôle: ${updatedUser.role}`);
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('💡 Cet utilisateur peut maintenant accéder aux routes admin');
        console.log('   en s\'authentifiant avec un token JWT.\n');

        return updatedUser;
    } catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Récupérer l'ID ou l'email depuis les arguments de la ligne de commande
const userIdOrEmail = process.argv[2];

if (!userIdOrEmail) {
    console.error('❌ Usage: node scripts/set-admin.js <user_id|email>');
    console.error('   Exemple: node scripts/set-admin.js 1');
    console.error('   Exemple: node scripts/set-admin.js admin@trackme.com');
    process.exit(1);
}

setAdmin(userIdOrEmail)
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

