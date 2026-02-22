import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

// Almacenamiento aislado asíncrono para solicitudes concurrentes seguras
const tiendaStorage = new AsyncLocalStorage<string>();

export function getTiendaContext(): string | null {
    return tiendaStorage.getStore() || null;
}

// Nueva función para ejecutar código acoplado al scope (Evita race-conditions Serverless)
export function runInTiendaContext<T>(tiendaId: string, fn: () => T): T {
    return tiendaStorage.run(tiendaId, fn);
}

// Mantenemos compatibilidad backward (Aunque se desaconseja, lo ideal es usar runInTiendaContext)
export function setTiendaContext(tiendaId: string | null) {
    // Obsoleto en concurrencia: AsyncLocalStorage requiere función envolvente .run()
}
export function clearTiendaContext() { }

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'] });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Force Prisma Client reload
if (process.env.NODE_ENV !== 'production' && globalThis.prisma) {
    delete globalThis.prisma;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Extensiones o Middleware de Prisma Multi-Tenant
const MODELOS_CON_TIENDA = [
    'Producto',
    'Proveedor',
    'OrdenCompra',
    'AjusteInventario',
    'MovimientoInventario',
    'Venta',
    'PerfilCliente'
];

// @ts-ignore: Prisma v5+ no exporta los tipos para $use cuando se pasa adapter config
prisma.$use(async (params: any, next: any) => {
    const currentTiendaId = getTiendaContext();
    if (!currentTiendaId) return next(params);
    if (!MODELOS_CON_TIENDA.includes(params.model || '')) return next(params);

    // QUERIES DE LECTURA (findMany, findFirst, count, aggregate)
    if (['findMany', 'findFirst', 'count', 'aggregate'].includes(params.action)) {
        params.args.where = { ...params.args.where, tiendaId: currentTiendaId };
    }

    // OPERACIONES DE ESCRITURA
    if (['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
        params.args.where = { ...params.args.where, tiendaId: currentTiendaId };
    }

    // CREACION
    if (params.action === 'create') {
        if (!params.args.data.tiendaId) params.args.data.tiendaId = currentTiendaId;
    }
    if (params.action === 'createMany') {
        params.args.data = params.args.data.map((item: any) => ({
            ...item,
            tiendaId: item.tiendaId || currentTiendaId
        }));
    }

    return next(params);
});

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
