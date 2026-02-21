import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Migrando movimientos de VENTA a SALIDA...');

    // Como el enum ya se cambió en el schema.prisma pero no se ha hecho db push,
    // prisma client generado arriba ya no tiene VENTA en su enum type si se regeneró.
    // Pero podemos usar queryRaw para estar seguros si hay problemas de tipos.

    try {
        const result = await prisma.$executeRawUnsafe(
            "UPDATE \"MovimientoInventario\" SET tipo = 'SALIDA' WHERE tipo = 'VENTA' OR tipo = 'TRASLADO'"
        );
        console.log(`Migración completada. Registros actualizados: ${result}`);
    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
