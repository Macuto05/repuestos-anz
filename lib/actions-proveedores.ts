'use server';

import prisma, { runInTiendaContext } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { obtenerSesionValidada, verificarAccesoRecurso } from '@/lib/auth/permissions';

// --- Tipos ---
export type CrearProveedorDTO = {
    nombre: string;
    rif?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
};

export type ActualizarProveedorDTO = Partial<CrearProveedorDTO> & {
    id: string;
    activo?: boolean;
};

// --- Actions ---

export async function listarProveedores(
    page: number = 1,
    limit: number = 10,
    search: string = ''
) {
    try {
        const session = await obtenerSesionValidada();

        return await runInTiendaContext(session.user.tiendaId, async () => {
            const skip = (page - 1) * limit;

            const where: any = {
                tiendaId: session.user.tiendaId,
                activo: true,
            };

            if (search) {
                where.OR = [
                    { nombre: { contains: search, mode: 'insensitive' } },
                    { rif: { contains: search, mode: 'insensitive' } },
                    { correo: { contains: search, mode: 'insensitive' } },
                ];
            }

            const [proveedores, total] = await Promise.all([
                prisma.proveedor.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.proveedor.count({ where }),
            ]);

            return {
                proveedores,
                total,
                totalPages: Math.ceil(total / limit)
            };
        });
    } catch (error) {
        console.error('Error listando proveedores:', error);
        return { error: 'Error al obtener proveedores' };
    }
}

export async function crearProveedor(data: CrearProveedorDTO) {
    try {
        const session = await obtenerSesionValidada();

        return await runInTiendaContext(session.user.tiendaId, async () => {
            const nuevoProveedor = await prisma.proveedor.create({
                data: {
                    ...data,
                    tiendaId: session.user.tiendaId!,
                },
            });

            revalidatePath('/proveedores');
            return { success: true, proveedor: nuevoProveedor };
        });
    } catch (error) {
        console.error('Error creando proveedor:', error);
        return { error: 'Error al crear el proveedor' };
    }
}

export async function actualizarProveedor(data: ActualizarProveedorDTO) {
    try {
        const session = await obtenerSesionValidada();
        const { id, ...updateData } = data;

        await verificarAccesoRecurso(id, 'proveedor', session, {
            accion: 'UPDATE',
            ruta: '/dashboard/proveedores/editar'
        });

        return await runInTiendaContext(session.user.tiendaId, async () => {
            await prisma.proveedor.update({
                where: { id },
                data: updateData,
            });

            revalidatePath('/proveedores');
            return { success: true };
        });
    } catch (error: any) {
        console.error('Error actualizando proveedor:', error);
        return { error: error.message || 'Error al actualizar' };
    }
}

export async function eliminarProveedor(id: string) {
    try {
        const session = await obtenerSesionValidada();
        await verificarAccesoRecurso(id, 'proveedor', session, {
            accion: 'DELETE',
            ruta: '/dashboard/proveedores'
        });

        return await runInTiendaContext(session.user.tiendaId, async () => {
            // Soft delete (marcar como inactivo)
            await prisma.proveedor.update({
                where: { id },
                data: { activo: false },
            });

            revalidatePath('/proveedores');
            return { success: true };
        });
    } catch (error: any) {
        console.error('Error eliminando proveedor:', error);
        return { error: error.message || 'Error al eliminar' };
    }
}
