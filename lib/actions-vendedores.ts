'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getVendedores() {
    const vendedores = await prisma.usuario.findMany({
        where: { rol: 'vendedor' },
        select: {
            id: true,
            email: true,
            cedula: true,
            nombre: true,
            telefono: true,
            activo: true,
            createdAt: true,
            tienda: {
                select: {
                    nombre: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return vendedores;
}

export async function createVendedor(formData: FormData) {
    const nombre = formData.get('nombre') as string;
    const cedula = formData.get('cedula') as string;
    const email = formData.get('email') as string;
    const telefonoCodigo = formData.get('telefono_codigo') as string;
    const telefonoNumero = formData.get('telefono_numero') as string;
    const password = formData.get('password') as string;

    if (!nombre || !cedula || !email || !password) {
        return { error: 'Nombre, cédula, email y contraseña son obligatorios.' };
    }

    if (password.length < 8) {
        return { error: 'La contraseña debe tener al menos 8 caracteres.' };
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        return { error: 'La contraseña debe ser segura (min. 8 caracteres, mayúscula, minúscula, número y especial).' };
    }

    // Build phone string
    if (!telefonoCodigo || !telefonoNumero || telefonoNumero.length !== 7) {
        return { error: 'El teléfono debe tener un código válido y 7 dígitos.' };
    }
    const telefono = `${telefonoCodigo}-${telefonoNumero}`;

    // Validate Cedula
    const [cedType, cedNum] = cedula.split('-');
    if (!cedType || !cedNum || cedNum.length < 6 || cedNum.length > 8 || !/^\d+$/.test(cedNum)) {
        return { error: 'Formato de cédula inválido.' };
    }

    // Check if email already exists
    const existingEmail = await prisma.usuario.findUnique({ where: { email } });
    if (existingEmail) {
        return { error: 'Ya existe un usuario con ese correo electrónico.' };
    }

    // Check if cedula already exists
    const existingCedula = await prisma.usuario.findUnique({ where: { cedula } });
    if (existingCedula) {
        return { error: 'Ya existe un usuario con esa cédula.' };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.usuario.create({
        data: {
            nombre,
            cedula,
            email,
            telefono,
            password: hashedPassword,
            rol: 'vendedor',
        },
    });

    revalidatePath('/admin/vendedores');
    return { success: true };
}

export async function updateVendedor(formData: FormData) {
    const id = formData.get('id') as string;
    const nombre = formData.get('nombre') as string;
    const cedula = formData.get('cedula') as string;
    const email = formData.get('email') as string;
    const telefonoCodigo = formData.get('telefono_codigo') as string;
    const telefonoNumero = formData.get('telefono_numero') as string;
    const password = formData.get('password') as string;

    if (!id || !nombre || !cedula || !email) {
        return { error: 'Nombre, cédula e email son obligatorios.' };
    }

    // Build phone string
    let telefono = null;
    if (telefonoCodigo && telefonoNumero) {
        if (telefonoNumero.length !== 7) {
            return { error: 'El teléfono debe tener 7 dígitos.' };
        }
        telefono = `${telefonoCodigo}-${telefonoNumero}`;
    }

    // Validate Cedula
    const [cedType, cedNum] = cedula.split('-');
    if (!cedType || !cedNum || cedNum.length < 6 || cedNum.length > 8 || !/^\d+$/.test(cedNum)) {
        return { error: 'Formato de cédula inválido.' };
    }

    // Check unique email (excluding self)
    const existingEmail = await prisma.usuario.findFirst({
        where: {
            email,
            id: { not: id },
        },
    });
    if (existingEmail) {
        return { error: 'Ya existe otro usuario con ese correo electrónico.' };
    }

    // Check unique cedula (excluding self)
    const existingCedula = await prisma.usuario.findFirst({
        where: {
            cedula,
            id: { not: id },
        },
    });
    if (existingCedula) {
        return { error: 'Ya existe otro usuario con esa cédula.' };
    }

    const updateData: any = {
        nombre,
        cedula,
        email,
        telefono,
    };

    if (password) {
        if (password.length < 8) {
            return { error: 'La contraseña debe tener al menos 8 caracteres.' };
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
            return { error: 'La contraseña debe ser segura (min. 8 caracteres, mayúscula, minúscula, número y especial).' };
        }
        updateData.password = await bcrypt.hash(password, 12);
    }

    await prisma.usuario.update({
        where: { id },
        data: updateData,
    });

    revalidatePath('/admin/vendedores');
    return { success: true };
}

export async function toggleVendedorActivo(id: string, activo: boolean) {
    await prisma.usuario.update({
        where: { id },
        data: { activo },
    });
    revalidatePath('/admin/vendedores');
    return { success: true };
}
