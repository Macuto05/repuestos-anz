import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testMultiTienda() {
    console.log('🧪 Iniciando prueba de arquitectura multi-tenant de clientes...');

    try {
        // 1. Obtener dos tiendas (una de Sevilla y otra de Madrid según el seed baseline)
        const tiendas = await prisma.tienda.findMany();
        if (tiendas.length < 1) {
            console.log('❌ No hay tiendas en la DB. Por favor ejecuta el seed primero.');
            return;
        }

        const tiendaA = tiendas[0];
        // Si solo hay una tienda, intentaremos crear una temporal o simplemente usar la misma para validar upsert
        const tiendaB = tiendas[1] || tiendaA;

        console.log(`Tienda A: ${tiendaA.nombre} (${tiendaA.id})`);
        console.log(`Tienda B: ${tiendaB.nombre} (${tiendaB.id})`);

        const datosCliente = {
            cedula: "22333444",
            nombre: "Juan Perez Global",
            telefono: "04121234567"
        };

        console.log('\n--- Paso 1: Cliente compra en Tienda A ---');
        // Importaríamos la acción, pero para el script lo haremos directo con la lógica del backend

        // Simulación de obtenerOCrearPerfilCliente
        const resA = await prisma.$transaction(async (tx) => {
            let user = await tx.usuario.findUnique({ where: { cedula: datosCliente.cedula } });
            if (!user) {
                user = await tx.usuario.create({
                    data: {
                        cedula: datosCliente.cedula,
                        nombre: datosCliente.nombre,
                        email: `${datosCliente.cedula}@test.com`,
                        password: "HASH",
                        rol: "cliente"
                    }
                });
                console.log('✅ Usuario global CREADO');
            }

            const perfil = await tx.perfilCliente.upsert({
                where: { usuarioId_tiendaId: { usuarioId: user.id, tiendaId: tiendaA.id } },
                update: {},
                create: { usuarioId: user.id, tiendaId: tiendaA.id },
                include: { usuario: true }
            });
            return perfil;
        });
        console.log(`✅ Perfil en Tienda A vinculado. ID: ${resA.id}`);

        console.log('\n--- Paso 2: El MISMO cliente compra en Tienda B ---');
        const resB = await prisma.$transaction(async (tx) => {
            let user = await tx.usuario.findUnique({ where: { cedula: datosCliente.cedula } });
            if (user) {
                console.log('✅ Usuario global ENCONTRADO (Sin duplicar)');
            }

            const perfil = await tx.perfilCliente.upsert({
                where: { usuarioId_tiendaId: { usuarioId: user!.id, tiendaId: tiendaB.id } },
                update: {},
                create: { usuarioId: user!.id, tiendaId: tiendaB.id },
                include: { usuario: true }
            });
            return perfil;
        });
        console.log(`✅ Perfil en Tienda B vinculado. ID: ${resB.id}`);

        // Verificaciones finales
        const totalUsuarios = await prisma.usuario.count({ where: { cedula: datosCliente.cedula } });
        const totalPerfiles = await prisma.perfilCliente.count({ where: { usuarioId: resA.usuarioId } });

        console.log('\n--- RESULTADOS ---');
        console.log(`Usuarios con CI ${datosCliente.cedula}: ${totalUsuarios} (Esperado: 1)`);
        console.log(`Perfiles para este usuario: ${totalPerfiles} (Esperado: 2 si son tiendas diferentes)`);

        if (totalUsuarios === 1 && (tiendaA.id !== tiendaB.id ? totalPerfiles === 2 : totalPerfiles === 1)) {
            console.log('\n🎉 PRUEBA SUPERADA: La arquitectura multi-tenant funciona correctamente.');
        } else {
            console.log('\n⚠️ Algunos resultados no coinciden con lo esperado.');
        }

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testMultiTienda();
