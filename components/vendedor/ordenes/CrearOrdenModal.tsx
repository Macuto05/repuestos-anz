'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Search, Trash2, ShoppingCart, DollarSign } from 'lucide-react';
import { crearMultiplesOrdenesCompra } from '@/lib/actions-ordenes';

interface Producto {
    id: string;
    nombre: string;
    codigoOEM: string | null;
    precio: any; // Precio de Venta (referencial)
}

interface Proveedor {
    id: string;
    nombre: string;
}

interface CrearOrdenModalProps {
    isOpen: boolean;
    onClose: () => void;
    proveedores: Proveedor[];
    productos: Producto[];
    usuarioId: string;
    tiendaId: string;
    onSuccess: () => void;
}

type DetalleTemp = {
    id: string;
    productoId: string;
    productoNombre: string;
    cantidad: number;
    costo: number;
    proveedorId: string; // Nuevo campo
}

export function CrearOrdenModal({ isOpen, onClose, proveedores, productos, usuarioId, tiendaId, onSuccess }: CrearOrdenModalProps) {
    const [detalles, setDetalles] = useState<DetalleTemp[]>([]);
    const [masivoProveedorId, setMasivoProveedorId] = useState('');

    // Line Item State
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [cantidad, setCantidad] = useState<number | ''>('');
    const [costo, setCosto] = useState<number | ''>('');
    const [searchProd, setSearchProd] = useState('');

    // Asignación de proveedor por defecto en el nuevo ítem si hay uno masivo seleccionado
    const [itemProveedorId, setItemProveedorId] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setDetalles([]);
            setMasivoProveedorId('');
            setSelectedProductoId('');
            setItemProveedorId('');
            setCantidad('');
            setCosto('');
            setSearchProd('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    if (!isOpen) return null;

    const filteredProductos = productos.filter(p =>
        p.nombre.toLowerCase().includes(searchProd.toLowerCase()) ||
        (p.codigoOEM && p.codigoOEM.toLowerCase().includes(searchProd.toLowerCase()))
    );

    const handleAddDetalle = () => {
        if (!selectedProductoId) return;
        const producto = productos.find(p => p.id === selectedProductoId);
        if (!producto) return;

        setDetalles([...detalles, {
            id: Math.random().toString(36).substr(2, 9),
            productoId: producto.id,
            productoNombre: producto.nombre,
            cantidad: Number(cantidad),
            costo: Number(costo),
            proveedorId: itemProveedorId || masivoProveedorId // Asigna el global si no se seleccionó uno específico
        }]);

        // Reset inputs
        setSelectedProductoId('');
        setCantidad('');
        setCosto('');
        setSearchProd('');
        setItemProveedorId('');
    };

    const handleApplyMassiveProvider = () => {
        if (!masivoProveedorId || detalles.length === 0) return;
        setDetalles(detalles.map(d => ({ ...d, proveedorId: masivoProveedorId })));
    };

    const updateItemProvider = (id: string, newProveedorId: string) => {
        setDetalles(detalles.map(d => d.id === id ? { ...d, proveedorId: newProveedorId } : d));
    };

    const handleRemoveDetalle = (id: string) => {
        setDetalles(detalles.filter(d => d.id !== id));
    };

    const totalEstimado = detalles.reduce((acc, d) => acc + (d.cantidad * d.costo), 0);

    const isValidToSubmit = detalles.length > 0 && detalles.every(d => d.proveedorId !== '');

    const handleSubmit = async () => {
        if (!isValidToSubmit) return;
        setIsSubmitting(true);
        try {
            // Agrupar detalles por proveedorId
            const ordenesPorProveedor = detalles.reduce((acc, detalle) => {
                if (!acc[detalle.proveedorId]) {
                    acc[detalle.proveedorId] = {
                        proveedorId: detalle.proveedorId,
                        totalEstimado: 0,
                        detalles: []
                    };
                }
                acc[detalle.proveedorId].detalles.push({
                    productoId: detalle.productoId,
                    cantidadSolicitada: detalle.cantidad,
                    costoUnitario: detalle.costo
                });
                acc[detalle.proveedorId].totalEstimado += (detalle.cantidad * detalle.costo);
                return acc;
            }, {} as Record<string, any>);

            const ordenesArray = Object.values(ordenesPorProveedor);

            await crearMultiplesOrdenesCompra({
                tiendaId,
                usuarioId,
                ordenes: ordenesArray
            });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Error al crear ordenes');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Nuevo Pedido a Proveedor</h2>
                        <p className="text-sm text-slate-500">Crea una orden de compra para reabastecimiento.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Agregar Productos */}
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-blue-600" />
                            Agregar Items
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            {/* Buscador */}
                            <div className="md:col-span-5 space-y-1 relative">
                                <label className="text-xs font-semibold text-slate-500">Producto</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={selectedProductoId ? (productos.find(p => p.id === selectedProductoId)?.nombre || '') : searchProd}
                                        onChange={(e) => {
                                            setSearchProd(e.target.value);
                                            setSelectedProductoId('');
                                        }}
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Buscar..."
                                    />
                                    {searchProd && !selectedProductoId && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                            {filteredProductos.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedProductoId(p.id);
                                                        setSearchProd('');
                                                        // Opcional: setCosto(p.costoUltimaCompra) si lo tuviéramos
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm truncate"
                                                >
                                                    {p.nombre}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cantidad */}
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Cant.</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={cantidad}
                                    placeholder="Ej: 10"
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setCantidad(val ? Number(val) : '');
                                    }}
                                    onKeyDown={(e) => {
                                        if (['.', ',', '+', '-', 'e', 'E'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            {/* Costo Unitario */}
                            <div className="md:col-span-3 space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Costo Unit ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={costo}
                                        placeholder="0.00"
                                        onChange={(e) => setCosto(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Add Button */}
                            <div className="md:col-span-2">
                                <button
                                    onClick={handleAddDetalle}
                                    disabled={!selectedProductoId || cantidad === '' || costo === '' || cantidad <= 0}
                                    className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Asignación Masiva */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-end gap-3 justify-end">
                        <div className="flex-1 max-w-sm space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Asignación Masiva</label>
                            <select
                                value={masivoProveedorId}
                                onChange={(e) => setMasivoProveedorId(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">-- Seleccionar Proveedor para todos --</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleApplyMassiveProvider}
                            disabled={!masivoProveedorId || detalles.length === 0}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 disabled:opacity-50 transition-colors"
                        >
                            Aplicar a Todo
                        </button>
                    </div>

                    {/* Tabla Detalles */}
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Insumo</th>
                                    <th className="px-4 py-3 text-center">Cant.</th>
                                    <th className="px-4 py-3 min-w-[200px]">Proveedor Asignado</th>
                                    <th className="px-4 py-3 text-right">Costo Unit.</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {detalles.map(d => (
                                    <tr key={d.id}>
                                        <td className="px-4 py-3 font-medium text-slate-900">{d.productoNombre}</td>
                                        <td className="px-4 py-3 text-center">{d.cantidad}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={d.proveedorId}
                                                onChange={(e) => updateItemProvider(d.id, e.target.value)}
                                                className={`w-full pl-2 pr-8 py-1.5 bg-white border rounded text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none truncate ${!d.proveedorId ? 'border-red-300 text-red-600 bg-red-50' : 'border-slate-200'}`}
                                            >
                                                <option value="">Seleccionar...</option>
                                                {proveedores.map(p => (
                                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-right">${d.costo.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-semibold">${(d.cantidad * d.costo).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleRemoveDetalle(d.id)} className="text-slate-400 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {detalles.length > 0 && (
                                    <tr className="bg-slate-50 font-bold text-slate-900">
                                        <td colSpan={4} className="px-4 py-3 text-right">Total Estimado General:</td>
                                        <td className="px-4 py-3 text-right text-lg">${totalEstimado.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-white rounded-lg transition-colors font-medium">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isValidToSubmit}
                        className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {isSubmitting ? 'Procesando...' : 'Crear Pedido'}
                    </button>
                </div>

            </div>
        </div>
    );
}
