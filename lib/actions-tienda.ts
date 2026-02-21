'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getTiendaByUsuario() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const tienda = await prisma.tienda.findUnique({
        where: { usuarioId: session.user.id },
    });

    return tienda;
}

export async function createTienda(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'No autenticado.' };
    }

    const nombre = formData.get('nombre') as string;
    const telefono = formData.get('telefono') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const ciudad = formData.get('ciudad') as string;
    const estado = formData.get('estado') as string;
    const direccion = formData.get('direccion') as string;
    const googleMapsUrl = formData.get('googleMapsUrl') as string;
    const horarioStr = formData.get('horario') as string;
    const horario = horarioStr ? JSON.parse(horarioStr) : null;

    // Validations
    if (!nombre || !telefono || !ciudad || !estado || !direccion) {
        return { error: 'Todos los campos obligatorios deben estar completos.' };
    }

    // Check if user already has a tienda
    const existing = await prisma.tienda.findUnique({
        where: { usuarioId: session.user.id },
    });

    if (existing) {
        return { error: 'Ya tienes una tienda registrada.' };
    }

    try {
        await prisma.tienda.create({
            data: {
                usuarioId: session.user.id,
                nombre,
                telefono,
                whatsapp: whatsapp || null,
                ciudad,
                estado,
                direccion,
                googleMapsUrl: googleMapsUrl || null,
                horario,
            },
        });

        revalidatePath('/tienda');
        return { success: true };
    } catch (error: any) {
        console.error('Error creating tienda:', error);
        return { error: `Error al crear la tienda: ${error.message}` };
    }
}

export async function updateTienda(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'No autenticado.' };
    }

    const id = formData.get('id') as string;
    const nombre = formData.get('nombre') as string;
    const telefono = formData.get('telefono') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const ciudad = formData.get('ciudad') as string;
    const estado = formData.get('estado') as string;
    const direccion = formData.get('direccion') as string;
    const googleMapsUrl = formData.get('googleMapsUrl') as string;
    const horarioStr = formData.get('horario') as string;
    const horario = horarioStr ? JSON.parse(horarioStr) : null;

    if (!id || !nombre || !telefono || !ciudad || !estado || !direccion) {
        return { error: 'Todos los campos obligatorios deben estar completos.' };
    }

    // Verify ownership
    const tienda = await prisma.tienda.findUnique({ where: { id } });
    if (!tienda || tienda.usuarioId !== session.user.id) {
        return { error: 'No tienes permiso para editar esta tienda.' };
    }

    try {
        await prisma.tienda.update({
            where: { id },
            data: {
                nombre,
                telefono,
                whatsapp: whatsapp || null,
                ciudad,
                estado,
                direccion,
                googleMapsUrl: googleMapsUrl || null,
                horario,
            },
        });

        revalidatePath('/tienda');
        return { success: true };
    } catch (error: any) {
        // Added more detailed error logging, including stack trace if available
        console.error('Error updating tienda:', error);
        if (error instanceof Error && error.stack) {
            console.error('Error stack:', error.stack);
        }
        return { error: `Error al actualizar la tienda: ${error.message || error}` };
    }
}
