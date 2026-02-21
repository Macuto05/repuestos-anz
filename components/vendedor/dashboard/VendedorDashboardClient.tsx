'use client';

import { Package, AlertTriangle, CheckCircle, TrendingDown, X, ExternalLink, Lightbulb, Headphones } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ProductoReciente {
    id: string;
    nombre: string;
    codigoOEM: string | null;
    precio: number;
    stock: number;
    stockMinimo?: number; // Optional because simpler lists might not have it
    imagenPrincipal: string | null;
}

interface VendedorDashboardProps {
    userName: string;
    totalProductos: number;
    sinStock: number;
    lowStock: number;
    inStock: number;
    productosRecientes: ProductoReciente[];
    outOfStockList: ProductoReciente[];
    lowStockList: ProductoReciente[];
}

export function VendedorDashboardClient({
    userName,
    totalProductos,
    sinStock,
    lowStock,
    inStock,
    productosRecientes,
    outOfStockList,
    lowStockList,
}: VendedorDashboardProps) {
    const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
    const [showLowStockModal, setShowLowStockModal] = useState(false);

    const firstName = userName.split(' ')[0];

    const stats = [
        {
            title: 'Total Productos',
            value: totalProductos.toLocaleString(),
            icon: Package,
            color: 'bg-blue-50 text-blue-600',
        },
        {
            title: 'Sin Stock',
            value: sinStock.toString(),
            icon: AlertTriangle,
            color: 'bg-red-50 text-red-600',
            alert: sinStock > 0,
            onClick: () => setShowOutOfStockModal(true),
        },
        {
            title: 'Stock Bajo',
            value: lowStock.toString(),
            icon: TrendingDown,
            color: 'bg-amber-50 text-amber-600',
            alert: lowStock > 0,
            onClick: () => setShowLowStockModal(true),
        },
        {
            title: 'En Stock',
            value: inStock.toString(),
            icon: CheckCircle,
            color: 'bg-emerald-50 text-emerald-600',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
                    <p className="text-slate-500 text-sm">Bienvenido de nuevo, {firstName}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className={`bg-white rounded-xl border border-slate-200 p-5 transition-all ${stat.onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''}`}
                        onClick={stat.onClick}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            {stat.alert && (
                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                                    Urgente
                                </span>
                            )}

                        </div>
                        <p className="text-sm text-slate-500">{stat.title}</p>
                        <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                ))}
            </div>


            {/* Bottom Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Consejo de optimización */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Consejo de optimización</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {sinStock > 0
                                    ? `Tienes ${sinStock} productos sin stock. Reponer estos artículos podría aumentar tus ventas semanales en un estimado del 12%.`
                                    : 'Todos tus productos tienen stock disponible. ¡Excelente trabajo!'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Soporte Técnico */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                            <Headphones className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Soporte Técnico</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                ¿Necesitas ayuda con la carga masiva de productos? Contacta con tu asesor asignado.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ProductListModal
                isOpen={showOutOfStockModal}
                onClose={() => setShowOutOfStockModal(false)}
                title="Productos Sin Stock"
                products={outOfStockList}
            />

            <ProductListModal
                isOpen={showLowStockModal}
                onClose={() => setShowLowStockModal(false)}
                title="Alertas de Stock Bajo"
                products={lowStockList}
            />
        </div>
    );
}

// Helper Components placed at the bottom or top
function StockProgressBar({ stock, min, max = 100 }: { stock: number; min: number; max?: number }) {
    let colorClass = 'bg-blue-500';
    if (stock === 0) colorClass = 'bg-red-500';
    else if (stock <= min) colorClass = 'bg-amber-500';

    const visualMax = Math.max(min * 4, 50);
    const percentage = Math.min((stock / visualMax) * 100, 100);
    const finalWidth = Math.max(percentage, 5);

    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${colorClass}`}
                    style={{ width: `${finalWidth}%` }}
                />
            </div>
            <span className="text-xs font-medium text-slate-500 w-8 text-right">{stock}</span>
        </div>
    );
}

function ProductListModal({
    isOpen,
    onClose,
    title,
    products
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    products: ProductoReciente[];
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-6">
                    {products.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No hay productos en esta lista.</p>
                    ) : (
                        <div className="space-y-4">
                            {products.map(product => (
                                <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                                    <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                        {product.imagenPrincipal ? (
                                            <img src={product.imagenPrincipal} alt={product.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-6 h-6 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-slate-900 truncate">{product.nombre}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                                {product.codigoOEM || 'S/N'}
                                            </span>
                                            {product.stockMinimo !== undefined && (
                                                <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                    Min: {product.stockMinimo}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${product.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                            {product.stock} un.
                                        </div>
                                        <div className="text-xs text-slate-400">${product.precio.toFixed(2)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
