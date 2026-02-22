'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { verificarAccesoRecurso } from '@/lib/auth/permissions';

export async function getProductos(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    categoriaId: string = '',
    estado: string = 'todos'
) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autenticado' };

    const tienda = await prisma.tienda.findUnique({
        where: { usuarioId: session.user.id },
        select: { id: true },
    });

    if (!tienda) return { error: 'No tienes una tienda registrada' };

    const skip = (page - 1) * limit;

    // Build filters
    const where: any = {
        tiendaId: tienda.id,
    };

    if (search) {
        where.OR = [
            { nombre: { contains: search, mode: 'insensitive' } },
            { codigoOEM: { contains: search, mode: 'insensitive' } },
            { marcaRepuesto: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (categoriaId && categoriaId !== 'todas') {
        where.categoriaId = categoriaId;
    }

    if (estado === 'activo') {
        where.disponible = true;
    } else if (estado === 'inactivo') {
        where.disponible = false;
    }

    try {
        // Fetch products
        const [productos, total] = await Promise.all([
            prisma.producto.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { categoria: true },
            }),
            prisma.producto.count({ where }),
        ]);

        // Get stats (independent of filters, usually)
        // Or maybe dependent? The mockup implies global stats for the store.
        const stats = await prisma.producto.aggregate({
            where: { tiendaId: tienda.id },
            _count: { id: true },
        });

        const inStock = await prisma.producto.count({
            where: { tiendaId: tienda.id, stock: { gt: 0 } },
        });

        const lowStock = await prisma.producto.count({
            where: { tiendaId: tienda.id, stock: { lte: 5 } }, // Assuming 5 is low stock threshold
        });

        return {
            productos: productos.map(p => ({
                ...p,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                precio: p.precio.toNumber(),
            })),
            total,
            totalPages: Math.ceil(total / limit),
            stats: {
                total: stats._count.id,
                inStock,
                lowStock,
            },
        };
    } catch (error) {
        console.error('Error fetching products:', error);
        return { error: 'Error al obtener productos' };
    }
}

export async function toggleProductoDisponible(id: string, disponible: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autenticado' };

    try {
        const tienda = await prisma.tienda.findUnique({
            where: { usuarioId: session.user.id },
        });

        if (!tienda) return { error: 'Tienda no encontrada' };

        // Verify ownership and log unauthorized access if attempted
        await verificarAccesoRecurso(id, 'producto', session, {
            accion: 'UPDATE',
            ruta: '/dashboard/productos'
        });

        await prisma.producto.update({
            where: { id },
            data: { disponible },
        });

        revalidatePath('/productos');
        return { success: true };
    } catch (error) {
        console.error('Error toggling product:', error);
        return { error: 'Error al actualizar producto' };
    }
}

export async function deleteProducto(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autenticado' };

    try {
        const tienda = await prisma.tienda.findUnique({
            where: { usuarioId: session.user.id },
        });

        if (!tienda) return { error: 'Tienda no encontrada' };

        // Verify ownership and log unauthorized access if attempted
        await verificarAccesoRecurso(id, 'producto', session, {
            accion: 'DELETE',
            ruta: '/dashboard/productos'
        });

        await prisma.producto.delete({
            where: { id },
        });

        revalidatePath('/productos');
        return { success: true };
    } catch (error) {
        console.error('Error deleting product:', error);
        return { error: 'Error al eliminar producto' };
    }
}

export async function getCategorias() {
    try {
        const categorias = await prisma.categoria.findMany({
            where: { activa: true },
            orderBy: { orden: 'asc' },
        });
        return categorias;
    } catch (error) {
        console.error('Error fetching categorias:', error);
        return [];
    }
}

export async function getMarcasVehiculo() {
    try {
        const marcas = await prisma.marcaVehiculo.findMany({
            where: { activa: true },
            orderBy: { nombre: 'asc' },
        });
        return marcas;
    } catch (error) {
        console.error('Error fetching marcas:', error);
        return [];
    }
}

export async function getModelosByMarca(marcaId: string) {
    try {
        const modelos = await prisma.modeloVehiculo.findMany({
            where: { marcaId, activa: true },
            orderBy: { nombre: 'asc' },
        });
        return modelos;
    } catch (error) {
        console.error('Error fetching modelos:', error);
        return [];
    }
}

interface CompatibilidadInput {
    marcaId: string;
    modeloId?: string;
    anoInicio?: number;
    anoFin?: number;
    motor?: string;
    notas?: string;
}

export async function createProducto(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autenticado' };

    try {
        const tienda = await prisma.tienda.findUnique({
            where: { usuarioId: session.user.id },
        });

        if (!tienda) return { error: 'No tienes una tienda registrada' };

        const nombre = formData.get('nombre') as string;
        const codigoOEM = formData.get('codigoOEM') as string || null;
        const categoriaId = formData.get('categoriaId') as string;
        const marcaRepuesto = formData.get('marcaRepuesto') as string;
        const descripcion = formData.get('descripcion') as string || null;
        const precio = parseFloat(formData.get('precio') as string);
        const stock = parseInt(formData.get('stock') as string);
        const stockMinimo = parseInt(formData.get('stockMinimo') as string) || 5;
        const disponible = formData.get('disponible') === 'true';
        const compatibilidadesRaw = formData.get('compatibilidades') as string;

        let compatibilidades: CompatibilidadInput[] = [];
        if (compatibilidadesRaw) {
            try {
                compatibilidades = JSON.parse(compatibilidadesRaw);
            } catch {
                // Ignore invalid JSON
            }
        }

        // Upload images to Cloudinary
        const imageFiles = formData.getAll('imagenes') as File[];
        const validImages = imageFiles.filter(f => f instanceof File && f.size > 0);
        let imageUrls: string[] = [];

        if (validImages.length > 0) {
            try {
                const { uploadImage } = await import('@/lib/cloudinary');
                const uploadResults = await Promise.all(
                    validImages.map(async (file) => {
                        const arrayBuffer = await file.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        return uploadImage(buffer, `repuestos-anz/tiendas/${tienda.id}`);
                    })
                );
                imageUrls = uploadResults.map(r => r.url);
            } catch (uploadError: any) {
                console.error('Error uploading images:', uploadError);
                return { error: `Error al subir imágenes: ${uploadError.message}` };
            }
        }

        // Create product with compatibilities in a transaction
        const producto = await prisma.$transaction(async (tx) => {
            const newProducto = await tx.producto.create({
                data: {
                    tiendaId: tienda.id,
                    nombre,
                    codigoOEM,
                    categoriaId,
                    marcaRepuesto,
                    descripcion: descripcion || null,
                    precio,
                    stock,
                    disponible,
                    imagenes: imageUrls,
                    imagenPrincipal: imageUrls[0] || null,
                },
            });

            // Create compatibilities
            if (compatibilidades.length > 0) {
                await tx.compatibilidad.createMany({
                    data: compatibilidades.map((c) => ({
                        productoId: newProducto.id,
                        marcaId: c.marcaId,
                        modeloId: c.modeloId || null,
                        anoInicio: c.anoInicio || null,
                        anoFin: c.anoFin || null,
                        motor: c.motor || null,
                        notas: c.notas || null,
                    })),
                });
            }

            return newProducto;
        });

        revalidatePath('/productos');
        return { success: true, productoId: producto.id };
    } catch (error: any) {
        console.error('Error creating product:', error);
        return { error: `Error al crear producto: ${error.message}` };
    }
}

export async function getProductoById(id: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const tienda = await prisma.tienda.findUnique({
            where: { usuarioId: session.user.id },
            select: { id: true },
        });

        if (!tienda) return null;

        const producto = await prisma.producto.findUnique({
            where: { id },
            include: {
                categoria: true,
                compatibilidades: {
                    include: {
                        marca: true,
                        modelo: true,
                    },
                },
            },
        });

        if (!producto || producto.tiendaId !== tienda.id) return null;

        return {
            ...producto,
            createdAt: producto.createdAt.toISOString(),
            updatedAt: producto.updatedAt.toISOString(),
            precio: producto.precio.toNumber(),
            compatibilidades: producto.compatibilidades.map(c => ({
                ...c,
                createdAt: c.createdAt.toISOString(),
                marcaNombre: c.marca.nombre,
                modeloNombre: c.modelo?.nombre || null,
            })),
        };
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

export async function updateProducto(id: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autenticado' };

    try {
        const tienda = await prisma.tienda.findUnique({
            where: { usuarioId: session.user.id },
        });

        if (!tienda) return { error: 'No tienes una tienda registrada' };

        // Verify ownership and log unauthorized access if attempted
        await verificarAccesoRecurso(id, 'producto', session, {
            accion: 'UPDATE',
            ruta: '/dashboard/productos/editar'
        });

        const nombre = formData.get('nombre') as string;
        const codigoOEM = formData.get('codigoOEM') as string || null;
        const categoriaId = formData.get('categoriaId') as string;
        const marcaRepuesto = formData.get('marcaRepuesto') as string;
        const descripcion = formData.get('descripcion') as string || null;
        const precio = parseFloat(formData.get('precio') as string);
        const stock = parseInt(formData.get('stock') as string);
        const stockMinimo = parseInt(formData.get('stockMinimo') as string) || 5;
        const disponible = formData.get('disponible') === 'true';
        const compatibilidadesJson = formData.get('compatibilidades') as string;
        const existingImagesJson = formData.get('existingImages') as string;

        // Validation
        if (!nombre || !categoriaId || !marcaRepuesto) {
            return { error: 'Nombre, categoría y marca del repuesto son obligatorios' };
        }

        if (isNaN(precio) || precio < 0) {
            return { error: 'El precio debe ser un número válido' };
        }

        if (isNaN(stock) || stock < 0) {
            return { error: 'El stock debe ser un número válido' };
        }

        let compatibilidades: CompatibilidadInput[] = [];
        if (compatibilidadesJson) {
            try {
                compatibilidades = JSON.parse(compatibilidadesJson);
            } catch {
                // Ignore
            }
        }

        // Parse existing images the user wants to keep
        let keptImages: string[] = [];
        if (existingImagesJson) {
            try {
                keptImages = JSON.parse(existingImagesJson);
            } catch {
                // Ignore
            }
        }

        // Upload new images to Cloudinary
        const imageFiles = formData.getAll('imagenes') as File[];
        const validImages = imageFiles.filter(f => f instanceof File && f.size > 0);
        let newImageUrls: string[] = [];

        if (validImages.length > 0) {
            try {
                const { uploadImage } = await import('@/lib/cloudinary');
                const uploadResults = await Promise.all(
                    validImages.map(async (file) => {
                        const arrayBuffer = await file.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        return uploadImage(buffer, `repuestos-anz/tiendas/${tienda.id}`);
                    })
                );
                newImageUrls = uploadResults.map(r => r.url);
            } catch (uploadError: any) {
                console.error('Error uploading images:', uploadError);
                return { error: `Error al subir imágenes: ${uploadError.message}` };
            }
        }

        // Final image list: kept existing + newly uploaded
        const allImages = [...keptImages, ...newImageUrls];

        // Update product and replace compatibilities in a transaction
        const producto = await prisma.$transaction(async (tx) => {
            const updated = await tx.producto.update({
                where: { id },
                data: {
                    nombre,
                    codigoOEM,
                    categoriaId,
                    marcaRepuesto,
                    descripcion: descripcion || null,
                    precio,
                    stock,
                    stockMinimo,
                    disponible,
                    imagenes: allImages,
                    imagenPrincipal: allImages[0] || null,
                },
            });

            // Replace compatibilities: delete old, create new
            await tx.compatibilidad.deleteMany({ where: { productoId: id } });

            if (compatibilidades.length > 0) {
                await tx.compatibilidad.createMany({
                    data: compatibilidades.map((c) => ({
                        productoId: id,
                        marcaId: c.marcaId,
                        modeloId: c.modeloId || null,
                        anoInicio: c.anoInicio || null,
                        anoFin: c.anoFin || null,
                        motor: c.motor || null,
                        notas: c.notas || null,
                    })),
                });
            }

            return updated;
        });

        revalidatePath('/productos');
        revalidatePath(`/productos/${id}/editar`);
        return { success: true, productoId: producto.id };
    } catch (error: any) {
        console.error('Error updating product:', error);
        return { error: `Error al actualizar producto: ${error.message}` };
    }
}

export async function getMarcasRepuesto() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const tienda = await prisma.tienda.findUnique({
            where: { usuarioId: session.user.id },
            select: { id: true },
        });

        if (!tienda) return [];

        const marcas = await prisma.producto.findMany({
            where: { tiendaId: tienda.id },
            select: { marcaRepuesto: true },
            distinct: ['marcaRepuesto'],
        });

        return marcas
            .map(m => m.marcaRepuesto)
            .filter((m): m is string => !!m)
            .sort((a, b) => a.localeCompare(b));
    } catch (error) {
        console.error('Error fetching unique brands:', error);
        return [];
    }
}
