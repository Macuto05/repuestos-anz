"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MetodoPago, MovimientoTipo } from "@prisma/client";

export type CrearVentaDTO = {
    tiendaId: string;
    usuarioId: string;
    clienteId?: string; // Opcional (venta anónima)
    metodoPago: MetodoPago;
    observaciones?: string;
    detalles: {
        productoId: string;
        cantidad: number;
        precioUnitario: number; // Permitir precio personalizado o del catálogo
    }[];
};

export async function crearVenta(data: CrearVentaDTO) {
    try {
        // Validar datos básicos
        if (!data.tiendaId || !data.usuarioId || !data.detalles.length) {
            return { success: false, error: "Datos incompletos para procesar la venta." };
        }

        // Calcular total
        const totalVenta = data.detalles.reduce((acc, item) => {
            return acc + (item.cantidad * item.precioUnitario);
        }, 0);

        // Iniciar transacción
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Crear la Venta
            const venta = await tx.venta.create({
                data: {
                    tiendaId: data.tiendaId,
                    usuarioId: data.usuarioId,
                    clienteId: data.clienteId,
                    metodoPago: data.metodoPago,
                    total: totalVenta,
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

            // 2. Crear Movimiento de Inventario (Tipo: VENTA)
            const movimiento = await tx.movimientoInventario.create({
                data: {
                    tiendaId: data.tiendaId,
                    usuarioId: data.usuarioId,
                    tipo: MovimientoTipo.SALIDA,
                    referencia: `Venta #${venta.consecutivo}`,
                    observaciones: "Salida por venta en punto de venta",
                    ventaId: venta.id, // Vincular movimiento a la venta
                },
            });

            // 3. Procesar cada detalle: Actualizar Stock y Crear Detalle Movimiento
            for (const item of data.detalles) {
                // Verificar stock actual
                const producto = await tx.producto.findUnique({
                    where: { id: item.productoId },
                });

                if (!producto) {
                    throw new Error(`Producto no encontrado: ${item.productoId}`);
                }

                if (producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para producto: ${producto.nombre}`);
                }

                // Actualizar stock
                const stockResultante = producto.stock - item.cantidad;
                await tx.producto.update({
                    where: { id: item.productoId },
                    data: { stock: stockResultante },
                });

                // Crear detalle de movimiento
                await tx.movimientoDetalle.create({
                    data: {
                        movimientoId: movimiento.id,
                        productoId: item.productoId,
                        cantidad: item.cantidad, // Guardamos positivo, el tipo VENTA indica salida
                        stockResultante: stockResultante,
                    },
                });
            }

            return venta;
        });

        revalidatePath("/admin/ventas"); // Revalidar rutas necesarias
        revalidatePath("/admin/kardex");
        revalidatePath("/admin/productos");

        return { success: true, data: resultado };
    } catch (error: any) {
        console.error("Error al crear venta:", error);
        return { success: false, error: error.message || "Error al procesar la venta" };
    }
}

// --- GESTIÓN DE CLIENTES ---

export type CrearClienteDTO = {
    tiendaId: string;
    nombre: string;
    apellido?: string;
    cedula: string;
    telefono?: string;
    email?: string;
    direccion?: string;
};

export async function crearCliente(data: CrearClienteDTO) {
    try {
        const nuevoCliente = await prisma.cliente.create({
            data: {
                tiendaId: data.tiendaId,
                nombre: data.nombre,
                apellido: data.apellido,
                cedula: data.cedula,
                telefono: data.telefono,
                email: data.email,
                direccion: data.direccion,
            },
        });

        return { success: true, data: nuevoCliente };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, error: "Ya existe un cliente con esta cédula en esta tienda." };
        }
        return { success: false, error: "Error al registrar cliente" };
    }
}

export async function buscarClientes(tiendaId: string, query: string) {
    if (!query || query.length < 2) return [];

    const clientes = await prisma.cliente.findMany({
        where: {
            tiendaId, // Aislamiento por tienda
            OR: [
                { nombre: { contains: query, mode: 'insensitive' } },
                { apellido: { contains: query, mode: 'insensitive' } },
                { cedula: { contains: query, mode: 'insensitive' } },
                { telefono: { contains: query, mode: 'insensitive' } },
            ]
        },
        take: 10,
        orderBy: { nombre: 'asc' }
    });
    return clientes;
}

export async function buscarProductosPOS(tiendaId: string, query: string) {
    if (!query || query.length < 2) return [];

    const productos = await prisma.producto.findMany({
        where: {
            tiendaId,
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
}
