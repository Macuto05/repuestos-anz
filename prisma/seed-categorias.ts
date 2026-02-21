import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Seed Categories
    const categorias = [
        { nombre: 'Motor', slug: 'motor', orden: 1 },
        { nombre: 'Frenos', slug: 'frenos', orden: 2 },
        { nombre: 'Suspensión', slug: 'suspension', orden: 3 },
        { nombre: 'Transmisión', slug: 'transmision', orden: 4 },
        { nombre: 'Eléctrico', slug: 'electrico', orden: 5 },
        { nombre: 'Carrocería', slug: 'carroceria', orden: 6 },
        { nombre: 'Refrigeración', slug: 'refrigeracion', orden: 7 },
        { nombre: 'Escape', slug: 'escape', orden: 8 },
        { nombre: 'Dirección', slug: 'direccion', orden: 9 },
        { nombre: 'Filtros', slug: 'filtros', orden: 10 },
        { nombre: 'Lubricantes', slug: 'lubricantes', orden: 11 },
        { nombre: 'Accesorios', slug: 'accesorios', orden: 12 },
    ];

    for (const cat of categorias) {
        await prisma.categoria.upsert({
            where: { slug: cat.slug },
            update: {},
            create: { nombre: cat.nombre, slug: cat.slug, orden: cat.orden, activa: true },
        });
    }
    console.log(`✅ ${categorias.length} categorías insertadas`);

    // Seed Vehicle Brands
    const marcas = [
        'Toyota', 'Chevrolet', 'Ford', 'Honda', 'Hyundai',
        'Kia', 'Nissan', 'Mazda', 'Mitsubishi', 'Volkswagen',
        'Suzuki', 'Fiat', 'Renault', 'Peugeot', 'Jeep',
        'Dodge', 'Chrysler', 'BMW', 'Mercedes-Benz', 'Audi',
        'Subaru', 'Volvo', 'Isuzu', 'Chery', 'Great Wall',
    ];

    for (const nombre of marcas) {
        const slug = nombre.toLowerCase().replace(/[^a-z0-9]/g, '-');
        await prisma.marcaVehiculo.upsert({
            where: { slug },
            update: {},
            create: { nombre, slug, activa: true },
        });
    }
    console.log(`✅ ${marcas.length} marcas de vehículos insertadas`);

    console.log('🎉 Seed completado!');
}

main()
    .catch((e) => {
        console.error('Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
