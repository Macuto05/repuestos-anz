'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

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
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        // Buscar la tienda del usuario
        const tienda = await prisma.tienda.findUnique({
            where: { usuarioId: session.user.id },
            select: { id: true },
        });

        if (!tienda) return { error: 'No tienes una tienda configurada' };

        const skip = (page - 1) * limit;

        const where: any = {
            tiendaId: tienda.id,
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
    } catch (error) {
        console.error('Error listando proveedores:', error);
        return { error: 'Error al obtener proveedores' };
    }
}

export async function crearProveedor(data: CrearProveedorDTO) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        const tienda = await prisma.tienda.findUnique({
            where: { usuarioId: session.user.id },
            select: { id: true },
        });

        if (!tienda) return { error: 'Tienda no encontrada' };

        const nuevoProveedor = await prisma.proveedor.create({
            data: {
                ...data,
                tiendaId: tienda.id,
            },
        });

        revalidatePath('/proveedores');
        return { success: true, proveedor: nuevoProveedor };
    } catch (error) {
        console.error('Error creando proveedor:', error);
        return { error: 'Error al crear el proveedor' };
    }
}

export async function actualizarProveedor(data: ActualizarProveedorDTO) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        const { id, ...updateData } = data;

        await prisma.proveedor.update({
            where: { id },
            data: updateData,
        });

        revalidatePath('/proveedores');
        return { success: true };
    } catch (error) {
        console.error('Error actualizando proveedor:', error);
        return { error: 'Error al actualizar' };
    }
}

export async function eliminarProveedor(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        // Soft delete (marcar como inactivo)
        await prisma.proveedor.update({
            where: { id },
            data: { activo: false },
        });

        revalidatePath('/proveedores');
        return { success: true };
    } catch (error) {
        console.error('Error eliminando proveedor:', error);
        return { error: 'Error al eliminar' };
    }
}
