import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categorias = [
    { nombre: 'Motor', slug: 'motor', orden: 1 },
    { nombre: 'Frenos', slug: 'frenos', orden: 2 },
    { nombre: 'Suspensión', slug: 'suspension', orden: 3 },
    { nombre: 'Eléctrico', slug: 'electrico', orden: 4 },
    { nombre: 'Transmisión', slug: 'transmision', orden: 5 },
    { nombre: 'Aceites y Lubricantes', slug: 'aceites-y-lubricantes', orden: 6 },
    { nombre: 'Carrocería', slug: 'carroceria', orden: 7 },
    { nombre: 'Neumáticos', slug: 'neumaticos', orden: 8 },
]

const vehiculos = [
    {
        marca: 'Toyota', slug: 'toyota', modelos: ['Corolla', 'Yaris', 'Hilux', 'Fortuner', 'Land Cruiser']
    },
    {
        marca: 'Chevrolet', slug: 'chevrolet', modelos: ['Aveo', 'Optra', 'Silverado', 'Cruze', 'Spark']
    },
    {
        marca: 'Ford', slug: 'ford', modelos: ['Fiesta', 'Explorer', 'Ka', 'F-150', 'EcoSport']
    },
    {
        marca: 'Nissan', slug: 'nissan', modelos: ['Sentra', 'Tiida', 'Frontier', 'Patrol', 'X-Trail']
    },
    {
        marca: 'Hyundai', slug: 'hyundai', modelos: ['Elantra', 'Tucson', 'Santa Fe', 'Accent', 'Getz']
    },
    {
        marca: 'Kia', slug: 'kia', modelos: ['Rio', 'Sportage', 'Picanto', 'Cerato', 'Sorento']
    },
    {
        marca: 'Mazda', slug: 'mazda', modelos: ['Mazda 3', 'Mazda 6', 'BT-50', 'CX-5', 'Allegro']
    },
    {
        marca: 'Honda', slug: 'honda', modelos: ['Civic', 'Accord', 'CR-V', 'Fit', 'Pilot']
    },
    {
        marca: 'Volkswagen', slug: 'volkswagen', modelos: ['Gol', 'Jetta', 'Fox', 'Golf', 'Amarok']
    },
    {
        marca: 'Jeep', slug: 'jeep', modelos: ['Cherokee', 'Grand Cherokee', 'Wrangler', 'Compass']
    },
    {
        marca: 'Mitsubishi', slug: 'mitsubishi', modelos: ['Lancer', 'Montero', 'Signo', 'Outlander']
    },
    {
        marca: 'Renault', slug: 'renault', modelos: ['Clio', 'Logan', 'Megane', 'Symbol', 'Kangaroo']
    },
    {
        marca: 'Peugeot', slug: 'peugeot', modelos: ['206', '207', '307', 'Partner']
    },
    {
        marca: 'Fiat', slug: 'fiat', modelos: ['Palio', 'Siena', 'Uno', 'Punto']
    },
    {
        marca: 'Chery', slug: 'chery', modelos: ['Orinoco', 'Arauca', 'Tiggo', 'QQ']
    },
]

async function main() {
    console.log('🌱 Start seeding...')

    // Seed Categories
    for (const cat of categorias) {
        await prisma.categoria.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        })
    }

    // Seed Brands and Models
    for (const v of vehiculos) {
        const marca = await prisma.marcaVehiculo.upsert({
            where: { slug: v.slug },
            update: {},
            create: {
                nombre: v.marca,
                slug: v.slug,
            },
        })

        for (const modeloName of v.modelos) {
            const modeloSlug = modeloName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

            await prisma.modeloVehiculo.upsert({
                where: {
                    marcaId_slug: {
                        marcaId: marca.id,
                        slug: modeloSlug,
                    }
                },
                update: {},
                create: {
                    nombre: modeloName,
                    slug: modeloSlug,
                    marcaId: marca.id,
                },
            })
        }
    }

    console.log('✅ Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
