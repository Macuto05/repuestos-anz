"use server";

import prisma, { runInTiendaContext } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MetodoPago, MovimientoTipo } from "@prisma/client";
import { obtenerSesionValidada } from "@/lib/auth/permissions";
import crypto from 'crypto';

/**
 * Genera un email único para clientes sin email
 * Formato: cliente-[hash]@noemail.repuestosanz.local
 */
function generarEmailTemporal(cedula: string): string {
    const hash = crypto.createHash('sha256')
        .update(`${cedula}-${Date.now()}`)
        .digest('hex')
        .substring(0, 12);
    return `cliente-${hash}@noemail.repuestosanz.local`;
}

/**
 * Genera un password aleatorio que nunca será usado
 * (Los clientes no tienen login por ahora)
 */
function generarPasswordNoUsable(): string {
    return crypto.randomBytes(32).toString('hex');
}

import { verificarAccesoRecurso } from "./auth/permissions";

export type CrearVentaDTO = {
    // tiendaId y usuarioId se extraen automáticamente de la sesión
    perfilClienteId?: string; // Opcional (venta anónima)
    metodoPago: MetodoPago;
    tasaDolar?: number;
    pagos?: {
        metodoPago: MetodoPago;
        montoUSD: number;
        montoBs?: number;
        referencia?: string;
    }[];
    observaciones?: string;
    detalles: {
        productoId: string;
        cantidad: number;
        precioUnitario: number;
    }[];
};

export async function crearVenta(data: CrearVentaDTO) {
    try {
        const session = await obtenerSesionValidada();

        return await runInTiendaContext(session.user.tiendaId, async () => {
            if (!data.detalles.length) {
                return { success: false, error: "Datos incompletos para procesar la venta." };
            }

            const totalUSD = data.detalles.reduce((acc, item) => {
                return acc + (item.cantidad * item.precioUnitario);
            }, 0);

            const totalBs = data.tasaDolar ? totalUSD * data.tasaDolar : null;

            const resultado = await prisma.$transaction(async (tx) => {
                const venta = await tx.venta.create({
                    data: {
                        tiendaId: session.user.tiendaId!,
                        usuarioId: session.user.id!,
                        perfilClienteId: data.perfilClienteId,
                        metodoPago: data.metodoPago,
                        totalUSD: totalUSD,
                        totalBs: totalBs,
                        tasaDolar: data.tasaDolar,
                        observaciones: data.observaciones,
                        detalles: {
                            create: data.detalles.map((d) => ({
                                productoId: d.productoId,
                                cantidad: d.cantidad,
                                precioUnitario: d.precioUnitario,
                                subtotal: d.cantidad * d.precioUnitario,
                            })),
                        },
                    },
                });

                // Si es pago MIXTO, crear registros en PagoVenta
                if (data.metodoPago === 'MIXTO' && data.pagos && data.pagos.length > 0) {
                    await tx.pagoVenta.createMany({
                        data: data.pagos.map(pago => ({
                            ventaId: venta.id,
                            metodoPago: pago.metodoPago,
                            montoUSD: pago.montoUSD,
                            montoBs: pago.montoBs,
                            referencia: pago.referencia
                        }))
                    });
                }

                // Actualizar estadísticas del perfil de cliente si existe
                if (data.perfilClienteId) {
                    await tx.perfilCliente.update({
                        where: { id: data.perfilClienteId },
                        data: {
                            ultimaCompra: new Date(),
                            totalCompras: { increment: 1 }
                        }
                    });
                }

                const movimiento = await tx.movimientoInventario.create({
                    data: {
                        tiendaId: session.user.tiendaId!,
                        usuarioId: session.user.id!,
                        tipo: MovimientoTipo.SALIDA,
                        referencia: `Venta #${venta.consecutivo}`,
                        observaciones: "Salida por venta en punto de venta",
                        ventaId: venta.id,
                    },
                });

                for (const item of data.detalles) {
                    await verificarAccesoRecurso(item.productoId, 'producto', session, {
                        accion: 'UPDATE',
                        ruta: '/dashboard/ventas/crear'
                    });

                    const producto = await tx.producto.findUnique({
                        where: { id: item.productoId },
                    });

                    if (!producto) {
                        throw new Error(`Producto no encontrado: ${item.productoId}`);
                    }

                    if (producto.stock < item.cantidad) {
                        throw new Error(`Stock insuficiente para producto: ${producto.nombre}`);
                    }

                    const stockResultante = producto.stock - item.cantidad;
                    await tx.producto.update({
                        where: { id: item.productoId },
                        data: { stock: stockResultante },
                    });

                    await tx.movimientoDetalle.create({
                        data: {
                            movimientoId: movimiento.id,
                            productoId: item.productoId,
                            cantidad: item.cantidad,
                            stockResultante: stockResultante,
                        },
                    });
                }

                return venta;
            });

            revalidatePath("/admin/ventas");
            revalidatePath("/admin/kardex");
            revalidatePath("/admin/productos");

            return { success: true, data: resultado };
        });
    } catch (error: any) {
        console.error("Error al crear venta:", error);
        return { success: false, error: error.message || "Error al procesar la venta" };
    }
}

// --- GESTIÓN DE CLIENTES ---

export type CrearClienteDTO = {
    nombre: string;
    cedula: string;
    telefono?: string;
    email?: string;
};

// Nueva función que maneja la lógica de Usuario Global + Perfil Tienda
export async function obtenerOCrearPerfilCliente(data: CrearClienteDTO): Promise<{ success: true; data: any } | { success: false; error: string }> {
    try {
        const session = await obtenerSesionValidada();

        return await runInTiendaContext(session.user.tiendaId, async () => {
            return await prisma.$transaction(async (tx) => {
                // 1. Buscar o crear Usuario global
                let usuario = await tx.usuario.findUnique({
                    where: { cedula: data.cedula }
                });

                if (!usuario) {
                    usuario = await tx.usuario.create({
                        data: {
                            cedula: data.cedula,
                            nombre: data.nombre,
                            email: data.email || generarEmailTemporal(data.cedula),
                            password: generarPasswordNoUsable(),
                            telefono: data.telefono,
                            rol: "cliente"
                        }
                    });
                }

                // 2. Buscar o crear Perfil para esta tienda específica
                const perfil = await tx.perfilCliente.upsert({
                    where: {
                        usuarioId_tiendaId: {
                            usuarioId: usuario.id,
                            tiendaId: session.user.tiendaId!
                        }
                    },
                    update: {}, // No actualizamos nada si ya existe, o podríamos actualizar notas
                    create: {
                        usuarioId: usuario.id,
                        tiendaId: session.user.tiendaId!,
                    },
                    include: {
                        usuario: true
                    }
                });

                return { success: true, data: perfil };
            });
        });
    } catch (error: any) {
        console.error("Error en obtenerOCrearPerfilCliente:", error);
        return { success: false, error: "Error al registrar cliente" };
    }
}

export async function buscarClientes(query: string) {
    if (!query || query.length < 2) return [];

    const session = await obtenerSesionValidada();

    return await runInTiendaContext(session.user.tiendaId, async () => {
        const perfiles = await prisma.perfilCliente.findMany({
            where: {
                tiendaId: session.user.tiendaId,
                OR: [
                    { usuario: { nombre: { contains: query, mode: 'insensitive' } } },
                    { usuario: { cedula: { contains: query, mode: 'insensitive' } } },
                    { usuario: { telefono: { contains: query, mode: 'insensitive' } } },
                ]
            },
            include: {
                usuario: true
            },
            take: 10,
            orderBy: { usuario: { nombre: 'asc' } }
        });

        // Mapear para que el frontend vea una estructura familiar o adaptada
        return perfiles.map(p => ({
            id: p.id,
            usuarioId: p.usuarioId,
            nombre: p.usuario.nombre,
            cedula: p.usuario.cedula,
            telefono: p.usuario.telefono,
            email: p.usuario.email,
            totalCompras: p.totalCompras
        }));
    });
}

export async function buscarProductosPOS(query: string) {
    if (!query || query.length < 2) return [];

    const session = await obtenerSesionValidada();

    return await runInTiendaContext(session.user.tiendaId, async () => {
        const productos = await prisma.producto.findMany({
            where: {
                tiendaId: session.user.tiendaId,
                disponible: true,
                OR: [
                    { nombre: { contains: query, mode: 'insensitive' } },
                    { codigoOEM: { contains: query, mode: 'insensitive' } },
                    // { descripcion: { contains: query, mode: 'insensitive' } } // Opcional, podría ensuciar resultados
                ]
            },
            select: {
                id: true,
                nombre: true,
                codigoOEM: true,
                precio: true,
                stock: true,
                imagenPrincipal: true,
                categoria: {
                    select: { nombre: true }
                }
            },
            take: 20,
            orderBy: { nombre: 'asc' } // O relevancia si fuera full text search
        });

        // Serializar decimales a números para el frontend
        return productos.map(p => ({
            ...p,
            precio: p.precio.toNumber()
        }));
    });
}
