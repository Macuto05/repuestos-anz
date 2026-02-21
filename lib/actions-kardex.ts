
'use server';

import prisma from '@/lib/prisma';
import { MovimientoTipo } from '@prisma/client';

interface FiltrosKardex {
    tiendaId: string;
    fechaInicio?: string;
    fechaFin?: string;
    tipo?: MovimientoTipo;
    productoId?: string;
    page?: number;
    limit?: number;
    search?: string;
}

export async function obtenerMovimientos({
    tiendaId,
    fechaInicio,
    fechaFin,
    tipo,
    productoId,
    page = 1,
    limit = 10,
    search = ''
}: FiltrosKardex) {
    try {
        const skip = (page - 1) * limit;
        const where: any = {
            tiendaId,
        };

        const VET_OFFSET = '-04:00';

        if (fechaInicio && fechaFin) {
            // Rango: entre inicio y fin
            const inicio = new Date(`${fechaInicio}T00:00:00${VET_OFFSET}`);
            const fin = new Date(`${fechaFin}T23:59:59${VET_OFFSET}`);
            where.fecha = {
                gte: inicio,
                lte: fin
            };
        } else if (fechaInicio) {
            // Solo una fecha: ese día completo
            const inicio = new Date(`${fechaInicio}T00:00:00${VET_OFFSET}`);
            const fin = new Date(`${fechaInicio}T23:59:59${VET_OFFSET}`);
            where.fecha = {
                gte: inicio,
                lte: fin
            };
        }

        if (tipo) {
            where.tipo = tipo;
        }

        if (productoId) {
            where.detalles = {
                some: {
                    productoId
                }
            };
        }

        if (search) {
            const searchFilters = [
                { referencia: { contains: search, mode: 'insensitive' } },
                { observaciones: { contains: search, mode: 'insensitive' } },
                { usuario: { nombre: { contains: search, mode: 'insensitive' } } },
                { detalles: { some: { producto: { nombre: { contains: search, mode: 'insensitive' } } } } },
                { detalles: { some: { producto: { codigoOEM: { contains: search, mode: 'insensitive' } } } } },
            ];

            if (where.OR) {
                // Si ya hay un OR (poco probable aquí pero por seguridad), lo combinamos
                where.AND = [
                    { OR: where.OR },
                    { OR: searchFilters }
                ];
                delete where.OR;
            } else {
                where.OR = searchFilters;
            }
        }

        const [movimientos, total] = await Promise.all([
            prisma.movimientoInventario.findMany({
                where,
                include: {
                    usuario: {
                        select: { nombre: true }
                    },
                    ordenCompra: {
                        select: { consecutivo: true, proveedor: { select: { nombre: true } } }
                    },
                    ajuste: {
                        select: { consecutivo: true, motivo: true }
                    },
                    detalles: {
                        include: {
                            producto: {
                                select: { nombre: true, codigoOEM: true, marcaRepuesto: true }
                            }
                        }
                    }
                },
                orderBy: {
                    fecha: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.movimientoInventario.count({ where }),
        ]);

        return {
            movimientos,
            total,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Error obteniendo kardex:', error);
        throw new Error('Error al obtener movimientos de inventario');
    }
}
