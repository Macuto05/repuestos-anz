import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { VendedorDashboardClient } from '@/components/vendedor/dashboard/VendedorDashboardClient';

export default async function VendedorDashboardPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const userId = session.user.id;
    const userName = session.user.name || 'Vendedor';

    // Get the vendor's tienda
    const tienda = await prisma.tienda.findUnique({
        where: { usuarioId: userId },
    });

    if (!tienda) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
                        <p className="text-slate-500 text-sm">Bienvenido de nuevo, {userName.split(' ')[0]}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No tienes una tienda configurada</h3>
                    <p className="text-sm text-slate-500 mb-4">Contacta con un administrador para que te asigne una tienda.</p>
                </div>
            </div>
        );
    }

    // Total products
    const totalProductos = await prisma.producto.count({
        where: { tiendaId: tienda.id },
    });

    // Out of stock products
    const sinStock = await prisma.producto.count({
        where: { tiendaId: tienda.id, stock: 0 },
    });

    // Recent products (last 10)
    // Recent products (last 8)
    const productosRecientes = await prisma.producto.findMany({
        where: { tiendaId: tienda.id },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
            id: true,
            nombre: true,
            codigoOEM: true,
            marcaRepuesto: true,
            precio: true,
            stock: true,
            stockMinimo: true,
            imagenPrincipal: true,
            createdAt: true,
        },
    });

    // Fetch ALL products to filter low stock in memory (Prisma limitation for field comparison)
    // In a large scale app, this should be a raw query or optimized.
    const allProducts = await prisma.producto.findMany({
        where: { tiendaId: tienda.id },
        select: {
            id: true,
            nombre: true,
            codigoOEM: true,
            stock: true,
            stockMinimo: true,
            imagenPrincipal: true,
            precio: true,
        },
    });

    const outOfStockProducts = allProducts.filter(p => p.stock === 0);
    const lowStockProducts = allProducts.filter(p => p.stock > 0 && p.stock <= p.stockMinimo);

    // Serialize for client
    const serializedRecientes = productosRecientes.map(p => ({
        id: p.id,
        nombre: p.nombre,
        codigoOEM: p.codigoOEM,
        precio: Number(p.precio),
        stock: p.stock,
        stockMinimo: p.stockMinimo,
        imagenPrincipal: p.imagenPrincipal,
    }));

    const serializedOutOfStock = outOfStockProducts.map(p => ({
        id: p.id,
        nombre: p.nombre,
        codigoOEM: p.codigoOEM,
        precio: Number(p.precio),
        stock: p.stock,
        imagenPrincipal: p.imagenPrincipal,
    }));

    const serializedLowStock = lowStockProducts.map(p => ({
        id: p.id,
        nombre: p.nombre,
        codigoOEM: p.codigoOEM,
        precio: Number(p.precio),
        stock: p.stock,
        stockMinimo: p.stockMinimo,
        imagenPrincipal: p.imagenPrincipal,
    }));

    const inStock = totalProductos - sinStock;

    return (
        <VendedorDashboardClient
            userName={userName}
            totalProductos={totalProductos}
            sinStock={outOfStockProducts.length}
            lowStock={lowStockProducts.length}
            inStock={inStock}
            productosRecientes={serializedRecientes}
            outOfStockList={serializedOutOfStock}
            lowStockList={serializedLowStock}
        />
    );
}
