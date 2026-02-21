'use server';

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

export async function getProductoDetail(id: string) {
    try {
        const producto = await prisma.producto.findUnique({
            where: { id },
            include: {
                tienda: {
                    select: {
                        nombre: true,
                        ciudad: true,
                        estado: true,
                        direccion: true,
                        telefono: true,
                        whatsapp: true,
                        googleMapsUrl: true,
                        horario: true,
                    }
                },
                compatibilidades: {
                    include: {
                        marca: true,
                        modelo: true,
                    },
                    orderBy: {
                        marca: { nombre: 'asc' }
                    }
                },
                categoria: true,
            }
        });

        if (!producto || !producto.disponible) {
            return null;
        }

        const p = producto as any;

        return {
            id: p.id,
            nombre: p.nombre,
            codigoOEM: p.codigoOEM,
            descripcion: p.descripcion,
            marcaRepuesto: p.marcaRepuesto,
            precio: Number(p.precio),
            stock: p.stock,
            imagenes: p.imagenes,
            imagenPrincipal: p.imagenPrincipal,
            disponible: p.disponible,
            categoriaId: p.categoriaId,
            categoria: p.categoria,
            tienda: p.tienda,
            compatibilidades: p.compatibilidades,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        };
    } catch (error) {
        console.error('Error fetching product detail:', error);
        return null;
    }
}

export async function getRelatedProducts(categoriaId: string, currentProductId: string) {
    try {
        const related = await prisma.producto.findMany({
            where: {
                categoriaId,
                id: { not: currentProductId },
                disponible: true,
                stock: { gt: 0 }
            },
            include: {
                tienda: {
                    select: {
                        nombre: true,
                        ciudad: true,
                        estado: true,
                    }
                }
            },
            take: 4,
            orderBy: {
                createdAt: 'desc'
            }
        });

        return related.map(p => ({
            id: p.id,
            nombre: p.nombre,
            marcaRepuesto: p.marcaRepuesto,
            precio: Number(p.precio),
            stock: p.stock,
            imagenPrincipal: p.imagenPrincipal,
            tiendaNombre: p.tienda.nombre,
            tiendaCiudad: p.tienda.ciudad,
            tiendaEstado: p.tienda.estado,
        }));
    } catch (error) {
        console.error('Error fetching related products:', error);
        return [];
    }
}
