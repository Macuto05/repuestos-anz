
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Renaming column "sku" to "codigoOEM" in "Producto" table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Producto" RENAME COLUMN "sku" TO "codigoOEM";`);
        console.log('Column renamed successfully.');
    } catch (error) {
        console.error('Error renaming column (maybe it already exists?):', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
