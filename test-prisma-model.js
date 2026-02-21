const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Verificando modelo AjusteInventario...');
    if (prisma.ajusteInventario) {
        console.log('¡EXITO! El modelo AjusteInventario existe en el cliente de Prisma generado.');
        // Probamos una consulta simple para asegurar conexión
        try {
            const count = await prisma.ajusteInventario.count();
            console.log(`Conexión exitosa. Cantidad de ajustes: ${count}`);
        } catch (e) {
            console.error('Error de conexión:', e.message);
        }
    } else {
        console.error('ERROR: El modelo AjusteInventario NO está definido en prisma.');
        console.log('Modelos disponibles:', Object.keys(prisma).filter(k => !k.startsWith('_') && k[0] === k[0].toLowerCase()));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
