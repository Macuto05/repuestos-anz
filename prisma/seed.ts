import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Forzar carga de DATABASE_URL si dotenv falla en este entorno
if (!process.env.DATABASE_URL) {
    try {
        const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
        const match = envFile.match(/DATABASE_URL=["']?(.+?)["']?(\s|$)/);
        if (match) {
            process.env.DATABASE_URL = match[1];
        }
    } catch (e) { }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Iniciando Seed Consolidado...');

    // 1. Categorías
    const categorias = [
        { nombre: 'Motor', slug: 'motor', orden: 1 },
        { nombre: 'Frenos', slug: 'frenos', orden: 2 },
        { nombre: 'Suspensión', slug: 'suspension', orden: 3 },
        { nombre: 'Eléctrico', slug: 'electrico', orden: 4 },
        { nombre: 'Transmisión', slug: 'transmision', orden: 5 },
        { nombre: 'Aceites y Lubricantes', slug: 'aceites-y-lubricantes', orden: 6 },
        { nombre: 'Carrocería', slug: 'carroceria', orden: 7 },
        { nombre: 'Neumáticos', slug: 'neumaticos', orden: 8 },
        { nombre: 'Refrigeración', slug: 'refrigeracion', orden: 9 },
        { nombre: 'Filtros', slug: 'filtros', orden: 10 },
    ];

    for (const cat of categorias) {
        await prisma.categoria.upsert({
            where: { slug: cat.slug },
            update: {},
            create: { ...cat, activa: true },
        });
    }
    console.log('✅ Categorías listas');

    // 2. Marcas y Modelos
    const vehiculos = [
        { marca: 'Toyota', slug: 'toyota', modelos: ['Corolla', 'Yaris', 'Hilux', 'Fortuner', 'Land Cruiser'] },
        { marca: 'Chevrolet', slug: 'chevrolet', modelos: ['Aveo', 'Optra', 'Silverado', 'Cruze', 'Spark'] },
        { marca: 'Ford', slug: 'ford', modelos: ['Fiesta', 'Explorer', 'Ka', 'F-150'] },
    ];

    for (const v of vehiculos) {
        const marca = await prisma.marcaVehiculo.upsert({
            where: { slug: v.slug },
            update: {},
            create: { nombre: v.marca, slug: v.slug, activa: true },
        });

        for (const mod of v.modelos) {
            const modSlug = mod.toLowerCase().replace(/\s+/g, '-');
            await prisma.modeloVehiculo.upsert({
                where: { marcaId_slug: { marcaId: marca.id, slug: modSlug } },
                update: {},
                create: { nombre: mod, slug: modSlug, marcaId: marca.id, activa: true },
            });
        }
    }
    console.log('✅ Vehículos listos');

    // 3. Usuario Admin y Tienda
    const emailAdmin = 'admin@repuestosanz.com';
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    const admin = await prisma.usuario.upsert({
        where: { email: emailAdmin },
        update: {},
        create: {
            email: emailAdmin,
            nombre: 'Administrador ANZ',
            password: hashedPassword,
            rol: 'admin',
            cedula: 'V-12345678',
            activo: true
        },
    });

    await prisma.tienda.upsert({
        where: { usuarioId: admin.id },
        update: {},
        create: {
            usuarioId: admin.id,
            nombre: 'Repuestos ANZ - Sede Principal',
            telefono: '0412-1234567',
            ciudad: 'Lechería',
            estado: 'Anzoátegui',
            direccion: 'Av. Intercomunal, Sector Las Garzas',
            activa: true
        },
    });

    console.log('✅ Usuario admin y Tienda configurados');
    console.log('🎉 Seed finalizado con éxito!');
}

main()
    .catch((e) => {
        console.error('❌ Error detallado en seed:');
        console.dir(e, { depth: null });
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
