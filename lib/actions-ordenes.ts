'use server';

import prisma from '@/lib/prisma';
import { EstadoOrden } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export type CrearOrdenDetalleDTO = {
    productoId: string;
    cantidadSolicitada: number;
    costoUnitario: number;
}

export type CrearMultiplesOrdenesDTO = {
    tiendaId: string;
    usuarioId: string;
    observaciones?: string;
    ordenes: {
        proveedorId: string;
        totalEstimado: number;
        detalles: CrearOrdenDetalleDTO[];
    }[];
}

export async function crearMultiplesOrdenesCompra(data: CrearMultiplesOrdenesDTO) {
    try {
        return await prisma.$transaction(async (tx) => {
            const resultados = [];
            for (const orden of data.ordenes) {
                const nuevaOrden = await tx.ordenCompra.create({
                    data: {
                        tiendaId: data.tiendaId,
                        usuarioId: data.usuarioId,
                        proveedorId: orden.proveedorId,
                        observaciones: data.observaciones,
                        totalEstimado: orden.totalEstimado,
                        estado: 'PENDIENTE',
                        detalles: {
                            create: orden.detalles.map((d: CrearOrdenDetalleDTO) => ({
                                productoId: d.productoId,
                                cantidadSolicitada: d.cantidadSolicitada,
                                costoUnitario: d.costoUnitario,
                                cantidadRecibida: 0
                            }))
                        }
                    }
                });
                resultados.push(nuevaOrden);
            }
            return resultados;
        });
    } catch (error) {
        console.error('Error creando órdenes de compra:', error);
        throw error;
    } finally {
        revalidatePath('/ordenes');
    }
}

export async function obtenerOrdenes(
    tiendaId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    estado?: string,
    fechaSolicitud?: string,
    fechaLlegada?: string
) {
    const skip = (page - 1) * limit;

    const where: any = {
        tiendaId,
    };

    if (search) {
        where.OR = [
            { proveedor: { nombre: { contains: search, mode: 'insensitive' } } },
            { detalles: { some: { producto: { nombre: { contains: search, mode: 'insensitive' } } } } },
            { detalles: { some: { producto: { codigoOEM: { contains: search, mode: 'insensitive' } } } } },
        ];

        const numericSearch = parseInt(search);
        if (!isNaN(numericSearch)) {
            where.OR.push({ consecutivo: numericSearch });
        }
    }

    if (estado && estado !== 'TODOS') {
        where.estado = estado;
    }

    const VET_OFFSET = '-04:00';

    if (fechaSolicitud && fechaLlegada) {
        // Rango: entre solicitud y llegada
        const inicio = new Date(`${fechaSolicitud}T00:00:00${VET_OFFSET}`);
        const fin = new Date(`${fechaLlegada}T23:59:59${VET_OFFSET}`);
        where.fechaSolicitud = {
            gte: inicio,
            lte: fin
        };
    } else if (fechaSolicitud) {
        // Solo solicitud: órdenes creadas ese día (VET)
        const inicio = new Date(`${fechaSolicitud}T00:00:00${VET_OFFSET}`);
        const fin = new Date(`${fechaSolicitud}T23:59:59${VET_OFFSET}`);
        where.fechaSolicitud = {
            gte: inicio,
            lte: fin
        };
    } else if (fechaLlegada) {
        // Solo llegada: órdenes que llegaron ese día (VET)
        const inicio = new Date(`${fechaLlegada}T00:00:00${VET_OFFSET}`);
        const fin = new Date(`${fechaLlegada}T23:59:59${VET_OFFSET}`);
        where.fechaLlegada = {
            gte: inicio,
            lte: fin
        };
    }

    try {
        const [ordenes, total] = await Promise.all([
            prisma.ordenCompra.findMany({
                where,
                include: {
                    proveedor: { select: { nombre: true, correo: true } },
                    usuario: { select: { nombre: true } },
                    detalles: {
                        include: {
                            producto: { select: { nombre: true, codigoOEM: true } }
                        }
                    },
                    _count: { select: { detalles: true } }
                },
                orderBy: { consecutivo: 'desc' },
                skip,
                take: limit,
            }),
            prisma.ordenCompra.count({ where }),
        ]);

        const serializedOrdenes = ordenes.map(orden => ({
            ...orden,
            totalEstimado: Number(orden.totalEstimado),
            detalles: orden.detalles.map(d => ({
                ...d,
                costoUnitario: Number(d.costoUnitario)
            }))
        }));

        return {
            ordenes: serializedOrdenes,
            total,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Error fetching ordenes:', error);
        throw error;
    }
}

export async function obtenerOrdenDetalle(ordenId: string) {
    const orden = await prisma.ordenCompra.findUnique({
        where: { id: ordenId },
        include: {
            proveedor: true,
            usuario: true,
            detalles: {
                include: {
                    producto: { select: { nombre: true, codigoOEM: true, stock: true } }
                }
            }
        }
    });

    if (!orden) return null;

    return {
        ...orden,
        totalEstimado: Number(orden.totalEstimado),
        detalles: orden.detalles.map(d => ({
            ...d,
            costoUnitario: Number(d.costoUnitario)
        }))
    };
}

// Acción CRÍTICA: Recibir mercancía e impactar inventario
export async function recibirOrdenCompra(ordenId: string, tiendaId: string, usuarioId: string) {
    try {
        return await prisma.$transaction(async (tx) => {
            // 1. Obtener orden con detalles
            const ordenFull = await tx.ordenCompra.findUnique({
                where: { id: ordenId },
                include: { detalles: true }
            });

            if (!ordenFull) {
                console.error(`Orden ${ordenId} no encontrada`);
                throw new Error('Orden no encontrada');
            }

            console.log(`Procesando orden #${ordenFull.consecutivo} con estado ${ordenFull.estado}`);

            if (ordenFull.estado === 'RECIBIDA' || ordenFull.estado === 'CANCELADA') {
                throw new Error('La orden ya fue procesada anteriormente');
            }

            // 2. Crear Movimiento Maestro (Kardex: COMPRA)
            const movimiento = await tx.movimientoInventario.create({
                data: {
                    tiendaId,
                    usuarioId,
                    tipo: 'ENTRADA', // Ingreso por compra
                    ordenCompraId: ordenId,
                    observaciones: `Recepción de Orden #${ordenFull.consecutivo}`,
                    referencia: `OC-${ordenFull.consecutivo}`
                }
            });

            // 3. Procesar cada detalle: Sumar stock y registrar movimiento detalle
            for (const detalle of ordenFull.detalles) {
                // Actualizamos que se recibió todo (escenario ideal simple)
                await tx.ordenCompraDetalle.update({
                    where: { id: detalle.id },
                    data: { cantidadRecibida: detalle.cantidadSolicitada }
                });

                // Obtener producto actual
                const producto = await tx.producto.findUnique({ where: { id: detalle.productoId } });

                if (!producto) {
                    console.warn(`Producto ${detalle.productoId} no encontrado en orden ${ordenId}`);
                    continue;
                }

                const nuevoStock = producto.stock + detalle.cantidadSolicitada;
                console.log(`Producto ${producto.nombre}: Stock ${producto.stock} -> ${nuevoStock}`);

                // Actualizar Producto
                await tx.producto.update({
                    where: { id: detalle.productoId },
                    data: { stock: nuevoStock }
                });

                // Registrar en Kardex Detalle
                await tx.movimientoDetalle.create({
                    data: {
                        movimientoId: movimiento.id,
                        productoId: detalle.productoId,
                        cantidad: detalle.cantidadSolicitada,
                        stockResultante: nuevoStock
                    }
                });
            }

            // 4. Actualizar Estado Orden y Fecha Llegada
            await tx.ordenCompra.update({
                where: { id: ordenId },
                data: {
                    estado: 'RECIBIDA',
                    fechaLlegada: new Date()
                }
            });

            return { success: true };
        });
    } catch (error: any) {
        console.error('============================');
        console.error('ERROR AL RECIBIR ORDEN:');
        console.error(error);
        if (error.code) console.error('Prisma Code:', error.code);
        if (error.meta) console.error('Prisma Meta:', error.meta);
        console.error('============================');
        throw error;
    } finally {
        revalidatePath('/ordenes');
        revalidatePath('/productos');
    }
}

export async function cancelarOrdenCompra(ordenId: string, motivo: string) {
    try {
        const orden = await prisma.ordenCompra.findUnique({
            where: { id: ordenId }
        });

        if (!orden) throw new Error('Orden no encontrada');
        if (orden.estado !== 'PENDIENTE') throw new Error('Solo se pueden cancelar órdenes pendientes');

        await prisma.ordenCompra.update({
            where: { id: ordenId },
            data: {
                estado: 'CANCELADA',
                observaciones: orden.observaciones
                    ? `${orden.observaciones}\n\n${motivo}`
                    : motivo
            }
        });

        revalidatePath('/ordenes');
        return { success: true };
    } catch (error) {
        console.error('Error cancelando orden:', error);
        throw error;
    }
}
