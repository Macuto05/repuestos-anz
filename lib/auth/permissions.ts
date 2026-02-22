import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { SecurityLoggerService } from '@/lib/services/SecurityLoggerService';

export async function obtenerSesionValidada() {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error('Usuario no autenticado o sin tienda asignada');
    }

    // NextAuth v5 custom. Si no provee directamente la tiendaId en el JWT asumo que buscamos contra el usuario actual
    // En nuestro sistema, cada usuario tiene a lo mucho 1 tienda en propiedad (si es vendedor/admin)
    const tienda = await prisma.tienda.findUnique({
        where: { usuarioId: session.user.id }
    });

    if (!tienda) {
        throw new Error('Usuario sin tienda asignada');
    }

    // Imbue el tiendaId a la sesión base
    return { ...session, user: { ...session.user, tiendaId: tienda.id } };
}

export async function verificarAccesoRecurso(
    recursoId: string,
    modelo: 'producto' | 'proveedor' | 'ordenCompra' | 'ajusteInventario' | 'venta',
    session: any,
    contexto?: {
        accion?: string;     // "UPDATE", "DELETE", "READ"
        ruta?: string;       // URL de la petición
        metodo?: string;     // "GET", "POST", "PUT", "DELETE"
    }
): Promise<any> {
    if (!session?.user?.tiendaId) {
        throw new Error('Usuario no autenticado');
    }

    // @ts-ignore: Acceso dinámico a prisma para varios modelos
    const recurso = await prisma[modelo].findUnique({
        where: { id: recursoId }
    });

    if (!recurso) {
        throw new Error('Recurso no encontrado');
    }

    if (recurso.tiendaId !== session.user.tiendaId) {
        // 🔥 LOGGING DEL INTENTO NO AUTORIZADO
        await SecurityLoggerService.logAccesoNoAutorizado({
            // Usuario atacante
            usuarioId: session.user.id,
            emailUsuario: session.user.email || 'sin-email',
            tiendaPropiaId: session.user.tiendaId,

            // Recurso objetivo
            recursoTipo: modelo,
            recursoId: recursoId,
            tiendaObjetivoId: recurso.tiendaId,

            // Contexto
            accion: contexto?.accion || 'UNKNOWN',
            ruta: contexto?.ruta,
            metodo: contexto?.metodo,

            // Detalles adicionales
            detalles: {
                recursoNombre: recurso.nombre || recurso.id,
                timestamp: new Date().toISOString()
            }
        });

        throw new Error('No tienes permiso para acceder a este recurso inter-tenant');
    }

    return recurso;
}

export async function validarSesionTienda() {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: 'No autenticado', status: 401 };
    }

    const tienda = await prisma.tienda.findUnique({
        where: { usuarioId: session.user.id }
    });

    if (!tienda) {
        return { error: 'Usuario sin tienda asignada', status: 403 };
    }

    return { session: { ...session, user: { ...session.user, tiendaId: tienda.id } }, error: null };
}
