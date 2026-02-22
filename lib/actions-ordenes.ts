'use server';

import prisma, { runInTiendaContext } from '@/lib/prisma';
import { EstadoOrden } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { obtenerSesionValidada, verificarAccesoRecurso } from '@/lib/auth/permissions';

export type CrearOrdenDetalleDTO = {
    productoId: string;
    cantidadSolicitada: number;
    costoUnitario: number;
}

export type CrearMultiplesOrdenesDTO = {
    tiendaId?: string; // Optativo ya que es autovalidado
    usuarioId?: string;
    observaciones?: string;
    ordenes: {
        proveedorId: string;
        totalEstimado: number;
        detalles: CrearOrdenDetalleDTO[];
    }[];
}

export async function crearMultiplesOrdenesCompra(data: CrearMultiplesOrdenesDTO) {
    try {
        const session = await obtenerSesionValidada();

        return await runInTiendaContext(session.user.tiendaId, async () => {
            return await prisma.$transaction(async (tx) => {
                const resultados = [];
                for (const orden of data.ordenes) {
                    const nuevaOrden = await tx.ordenCompra.create({
                        data: {
                            tiendaId: session.user.tiendaId!,
                            usuarioId: session.user.id!,
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
        });
    } catch (error) {
        console.error('Error creando órdenes de compra:', error);
        throw error;
    } finally {
        revalidatePath('/ordenes');
    }
}

export async function obtenerOrdenes(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    estado?: string,
    fechaSolicitud?: string,
    fechaLlegada?: string
) {
    const session = await obtenerSesionValidada();

    return await runInTiendaContext(session.user.tiendaId, async () => {
        const skip = (page - 1) * limit;

        const where: any = {
            tiendaId: session.user.tiendaId,
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
    });
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
// Soporta recepción parcial para futuras implementaciones
export async function recibirOrdenCompra(
    ordenId: string,
    detallesRecibidos?: { detalleId: string, cantidadRecibida: number }[]
) {
    try {
        const session = await obtenerSesionValidada();

        // Validar acceso (y loggear intentos sospechosos)
        await verificarAccesoRecurso(ordenId, 'ordenCompra', session, {
            accion: 'UPDATE',
            ruta: '/dashboard/ordenes/recibir'
        });

        return await runInTiendaContext(session.user.tiendaId, async () => {
            return await prisma.$transaction(async (tx) => {
                // 1. Obtener orden con detalles y productos para validación
                const ordenFull = await tx.ordenCompra.findUnique({
                    where: { id: ordenId },
                    include: {
                        detalles: {
                            include: { producto: { select: { nombre: true, stock: true } } }
                        }
                    }
                });

                if (!ordenFull) {
                    console.error(`Orden ${ordenId} no encontrada`);
                    throw new Error('Orden no encontrada');
                }

                console.log(`Procesando orden #${ordenFull.consecutivo} con estado ${ordenFull.estado}`);

                if (ordenFull.estado === 'RECIBIDA' || ordenFull.estado === 'CANCELADA') {
                    throw new Error('La orden ya fue procesada anteriormente');
                }

                // Si no se especifican detalles, se asume recepción total (comportamiento actual)
                const mapeoRecibidos = detallesRecibidos || ordenFull.detalles.map(d => ({
                    detalleId: d.id,
                    cantidadRecibida: d.cantidadSolicitada
                }));

                // 2. Crear Movimiento Maestro (Kardex: COMPRA)
                const movimiento = await tx.movimientoInventario.create({
                    data: {
                        tiendaId: session.user.tiendaId!,
                        usuarioId: session.user.id!,
                        tipo: 'ENTRADA', // Ingreso por compra
                        ordenCompraId: ordenId,
                        observaciones: `Recepción de Orden #${ordenFull.consecutivo}`,
                        referencia: `OC-${ordenFull.consecutivo}`
                    }
                });

                // 3. Procesar cada detalle solicitado para recibir
                for (const item of mapeoRecibidos) {
                    const detalleOriginal = ordenFull.detalles.find(d => d.id === item.detalleId);

                    if (!detalleOriginal) {
                        throw new Error(`Detalle de orden ${item.detalleId} no encontrado`);
                    }

                    // VALIDACIÓN DE SEGURIDAD
                    if (item.cantidadRecibida > detalleOriginal.cantidadSolicitada) {
                        throw new Error(
                            `No se puede recibir más de lo solicitado para ${detalleOriginal.producto.nombre}. ` +
                            `Solicitado: ${detalleOriginal.cantidadSolicitada}, Intentando recibir: ${item.cantidadRecibida}`
                        );
                    }

                    if (item.cantidadRecibida < 0) {
                        throw new Error(`La cantidad recibida no puede ser negativa para ${detalleOriginal.producto.nombre}`);
                    }

                    // Actualizar detalle de la orden con lo efectivamente recibido
                    await tx.ordenCompraDetalle.update({
                        where: { id: detalleOriginal.id },
                        data: { cantidadRecibida: item.cantidadRecibida }
                    });

                    // Solo impactamos stock si se recibió algo
                    if (item.cantidadRecibida > 0) {
                        const nuevoStock = detalleOriginal.producto.stock + item.cantidadRecibida;
                        console.log(`Producto ${detalleOriginal.producto.nombre}: Stock ${detalleOriginal.producto.stock} -> ${nuevoStock}`);

                        // Actualizar Producto
                        await tx.producto.update({
                            where: { id: detalleOriginal.productoId },
                            data: { stock: nuevoStock }
                        });

                        // Registrar en Kardex Detalle
                        await tx.movimientoDetalle.create({
                            data: {
                                movimientoId: movimiento.id,
                                productoId: detalleOriginal.productoId,
                                cantidad: item.cantidadRecibida,
                                stockResultante: nuevoStock
                            }
                        });
                    }
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
        });
    } catch (error: any) {
        console.error('============================');
        console.error('ERROR AL RECIBIR ORDEN:');
        console.error(error.message || error);
        console.error('============================');
        throw error;
    } finally {
        revalidatePath('/ordenes');
        revalidatePath('/productos');
    }
}

export async function cancelarOrdenCompra(ordenId: string, motivo: string) {
    try {
        const session = await obtenerSesionValidada();

        // Validar acceso (y loggear intentos sospechosos)
        await verificarAccesoRecurso(ordenId, 'ordenCompra', session, {
            accion: 'DELETE',
            ruta: '/dashboard/ordenes'
        });

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
