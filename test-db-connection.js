require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Intentando conectar a la base de datos...');
        const count = await prisma.usuario.count();
        console.log(`Conexión EXITOSA. Usuarios encontrados: ${count}`);
    } catch (e) {
        console.error('ERROR DE CONEXIÓN:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
