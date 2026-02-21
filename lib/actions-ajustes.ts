'use server';

import prisma from '@/lib/prisma';
import { MovimientoTipo, MotivoAjuste } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export type CrearAjusteDetalleDTO = {
    productoId: string;
    cantidad: number;
    tipo: MovimientoTipo; // ENTRADA | SALIDA
    motivo: MotivoAjuste;
    observaciones?: string;
}

export type CrearAjusteDTO = {
    tiendaId: string;
    usuarioId: string;
    detalles: CrearAjusteDetalleDTO[];
}

export async function crearAjusteInventario(data: CrearAjusteDTO) {
    try {
        return await prisma.$transaction(async (tx) => {
            const resultados = [];

            for (const item of data.detalles) {
                // 1. Crear el Ajuste (Uno por cada producto)
                const ajuste = await tx.ajusteInventario.create({
                    data: {
                        tiendaId: data.tiendaId,
                        usuarioId: data.usuarioId,
                        motivo: item.motivo,
                        observaciones: item.observaciones,
                    }
                });

                // 2. Crear el registro maestro de Movimiento (Kardex) individual
                const movimiento = await tx.movimientoInventario.create({
                    data: {
                        tiendaId: data.tiendaId,
                        usuarioId: data.usuarioId,
                        tipo: 'AJUSTE',
                        ajusteId: ajuste.id,
                        referencia: `AJ-${ajuste.consecutivo}`,
                        observaciones: item.motivo,
                    }
                });

                // 3. Procesar el stock
                const producto = await tx.producto.findUnique({
                    where: { id: item.productoId }
                });

                if (!producto) throw new Error(`Producto ${item.productoId} no encontrado`);

                let cambioStock = item.cantidad;
                if (item.tipo === 'SALIDA') {
                    cambioStock = -item.cantidad;
                }

                if (item.tipo === 'SALIDA' && producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para el producto ${producto.nombre}. Stock actual: ${producto.stock}`);
                }

                const nuevoStock = producto.stock + cambioStock;

                // 3.1 Actualizar Stock
                await tx.producto.update({
                    where: { id: item.productoId },
                    data: { stock: nuevoStock }
                });

                // 3.2 Crear Detalle de Ajuste
                await tx.detalleAjuste.create({
                    data: {
                        ajusteId: ajuste.id,
                        productoId: item.productoId,
                        cantidad: item.cantidad,
                        tipo: item.tipo
                    }
                });

                // 3.3 Crear Detalle de Movimiento
                await tx.movimientoDetalle.create({
                    data: {
                        movimientoId: movimiento.id,
                        productoId: item.productoId,
                        cantidad: cambioStock,
                        stockResultante: nuevoStock
                    }
                });

                resultados.push(ajuste);
            }

            return resultados;
        });

    } catch (error) {
        console.error('Error creando ajustes de inventario:', error);
        throw error;
    } finally {
        revalidatePath('/ajustes');
        revalidatePath('/productos');
    }
}

export async function obtenerAjustes(
    tiendaId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    motivo?: MotivoAjuste,
    tipo?: MovimientoTipo,
    fechaInicio?: string,
    fechaFin?: string
) {
    const skip = (page - 1) * limit;
    const VET_OFFSET = '-04:00';
    const where: any = {
        tiendaId,
    };

    // Filtros específicos con lógica estricta (Si se pide filtro, se aplica sí o sí)
    if (motivo) {
        const motivosValidos = Object.values(MotivoAjuste) as string[];
        if (motivosValidos.includes(motivo)) {
            where.motivo = motivo as MotivoAjuste;
        } else {
            // Valor no está en el enum actual del cliente, forzamos vacío
            where.id = 'force-empty-invalid-motivo';
        }
    }

    if (tipo) {
        const tiposValidos = Object.values(MovimientoTipo) as string[];
        if (tiposValidos.includes(tipo)) {
            where.detalles = {
                some: { tipo: tipo as MovimientoTipo }
            };
        } else {
            // Valor no válido para tipo
            where.id = 'force-empty-invalid-tipo';
        }
    }

    if (fechaInicio && fechaFin) {
        where.fecha = {
            gte: new Date(`${fechaInicio}T00:00:00${VET_OFFSET}`),
            lte: new Date(`${fechaFin}T23:59:59${VET_OFFSET}`)
        };
    } else if (fechaInicio) {
        where.fecha = {
            gte: new Date(`${fechaInicio}T00:00:00${VET_OFFSET}`),
            lte: new Date(`${fechaInicio}T23:59:59${VET_OFFSET}`)
        };
    }

    // Búsqueda global (Motivo, Usuario, Consecutivo o Producto)
    if (search) {
        const numericSearch = parseInt(search);

        where.OR = [
            { observaciones: { contains: search, mode: 'insensitive' } },
            { usuario: { nombre: { contains: search, mode: 'insensitive' } } },
            {
                detalles: {
                    some: {
                        producto: {
                            OR: [
                                { nombre: { contains: search, mode: 'insensitive' } },
                                { codigoOEM: { contains: search, mode: 'insensitive' } }
                            ]
                        }
                    }
                }
            }
        ];

        if (!isNaN(numericSearch)) {
            where.OR.push({ consecutivo: numericSearch });
        }

        // También intentar buscar en el enum motivo si matchea
        const motivoEnum = Object.values(MotivoAjuste).find(m => m.toLowerCase().includes(search.toLowerCase()));
        if (motivoEnum) {
            where.OR.push({ motivo: motivoEnum });
        }
    }

    try {
        const [ajustes, total] = await Promise.all([
            prisma.ajusteInventario.findMany({
                where,
                include: {
                    usuario: {
                        select: { nombre: true, email: true }
                    },
                    detalles: {
                        include: {
                            producto: { select: { nombre: true, codigoOEM: true } }
                        }
                    }
                },
                orderBy: { fecha: 'desc' },
                skip,
                take: limit,
            }),
            prisma.ajusteInventario.count({ where }),
        ]);

        return {
            ajustes,
            total,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error: any) {
        console.error('Error fetching ajustes:', error.message || 'Unknown error');
        return {
            ajustes: [],
            total: 0,
            totalPages: 0
        };
    }
}
