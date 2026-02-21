
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Conectando a la base de datos...');

    try {
        // 1. Cambiar la contraseña del usuario postgres a 'admin123'
        // Esto asegura que cuando quites "trust", la clave del .env funcione.
        // await prisma.$executeRawUnsafe("ALTER USER postgres WITH PASSWORD 'admin123';");
        console.log('✅ Contraseña de PostgreSQL ya fue actualizada manualmente.');

        // 2. Crear usuario vendedor de prueba
        const email = 'vendedor@repuestosanz.com';
        const password = await bcrypt.hash('123456', 10);

        const user = await prisma.usuario.upsert({
            where: { email },
            update: { password }, // Actualiza clave si ya existe
            create: {
                email,
                password,
                nombre: 'Vendedor Demo',
                telefono: '555-0000',
                rol: 'vendedor',
                activa: true
            }
        });

        console.log(`✅ Usuario creado/actualizado: ${user.email} (Pass: 123456)`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
