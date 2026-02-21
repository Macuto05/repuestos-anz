'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Search, Trash2, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { crearAjusteInventario } from '@/lib/actions-ajustes';

interface Producto {
    id: string;
    nombre: string;
    codigoOEM: string | null;
    stock: number;
}

interface CrearAjusteModalProps {
    isOpen: boolean;
    onClose: () => void;
    productos: Producto[];
    usuarioId: string;
    tiendaId: string;
    onSuccess: () => void;
}

type DetalleTemp = {
    id: string; // temp id
    productoId: string;
    productoNombre: string;
    cantidad: number;
    tipo: 'ENTRADA' | 'SALIDA';
    motivo: string;
    observaciones: string;
    stockActual: number;
}

export function CrearAjusteModal({ isOpen, onClose, productos, usuarioId, tiendaId, onSuccess }: CrearAjusteModalProps) {
    const [detalles, setDetalles] = useState<DetalleTemp[]>([]);

    // States for adding a new line item
    const [motivo, setMotivo] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [cantidad, setCantidad] = useState<number | string>('');
    const [tipoMovimiento, setTipoMovimiento] = useState<'ENTRADA' | 'SALIDA'>('SALIDA');
    const [searchProd, setSearchProd] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setDetalles([]);
            setMotivo('');
            setObservaciones('');
            setSelectedProductoId('');
            setCantidad('');
            setSearchProd('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredProductos = productos.filter(p =>
        p.nombre.toLowerCase().includes(searchProd.toLowerCase()) ||
        (p.codigoOEM && p.codigoOEM.toLowerCase().includes(searchProd.toLowerCase()))
    );

    const handleAddDetalle = () => {
        if (!selectedProductoId) return;

        const producto = productos.find(p => p.id === selectedProductoId);
        if (!producto) return;

        if (!motivo) {
            setError('Debes indicar un motivo para el producto');
            return;
        }

        // Validar stock si es salida
        if (tipoMovimiento === 'SALIDA' && Number(cantidad) > producto.stock) {
            setError(`Stock insuficiente. Disponible: ${producto.stock}`);
            return;
        }

        const nuevoDetalle: DetalleTemp = {
            id: Math.random().toString(36).substr(2, 9),
            productoId: producto.id,
            productoNombre: producto.nombre,
            cantidad: Number(cantidad),
            tipo: tipoMovimiento,
            motivo,
            observaciones,
            stockActual: producto.stock
        };

        setDetalles([...detalles, nuevoDetalle]);

        // Reset inputs
        setSelectedProductoId('');
        setCantidad('');
        setSearchProd('');
        setMotivo('');
        setObservaciones('');
        setError('');
    };

    const handleRemoveDetalle = (id: string) => {
        setDetalles(detalles.filter(d => d.id !== id));
    };

    const handleSubmit = async () => {
        if (detalles.length === 0) {
            setError('Debes agregar al menos un producto');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await crearAjusteInventario({
                tiendaId,
                usuarioId,
                detalles: detalles.map(d => ({
                    productoId: d.productoId,
                    cantidad: d.cantidad,
                    tipo: d.tipo,
                    motivo: d.motivo as any,
                    observaciones: d.observaciones
                }))
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al guardar el ajuste');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Producto seleccionado actual object
    const selectedProdObj = productos.find(p => p.id === selectedProductoId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Nuevo Ajuste de Inventario</h2>
                        <p className="text-sm text-slate-500">Registra entradas o salidas manuales.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm font-medium animate-pulse">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <hr className="border-slate-100" />

                    {/* Agregar Productos */}
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-blue-600" />
                            Agregar Producto
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            {/* Buscador Producto */}
                            <div className="md:col-span-5 space-y-1 relative">
                                <label className="text-xs font-semibold text-slate-500">Producto</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={selectedProductoId ? (selectedProdObj?.nombre || '') : searchProd}
                                        onChange={(e) => {
                                            setSearchProd(e.target.value);
                                            setSelectedProductoId(''); // Deseleccionar si escribe
                                        }}
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Buscar producto..."
                                    />
                                    {/* Dropdown de resultados */}
                                    {searchProd && !selectedProductoId && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                            {filteredProductos.length === 0 ? (
                                                <div className="p-3 text-xs text-slate-400 text-center">No encontrado</div>
                                            ) : (
                                                filteredProductos.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            setSelectedProductoId(p.id);
                                                            setSearchProd('');
                                                        }}
                                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between items-center"
                                                    >
                                                        <span className="truncate">{p.nombre}</span>
                                                        <span className="text-xs text-slate-400 font-mono">Stock: {p.stock}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tipo Movimiento */}
                            <div className="md:col-span-4 space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Tipo Movimiento</label>
                                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                                    <button
                                        onClick={() => setTipoMovimiento('ENTRADA')}
                                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs font-medium transition-colors ${tipoMovimiento === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <ArrowDownLeft className="w-3 h-3" /> Ent
                                    </button>
                                    <button
                                        onClick={() => setTipoMovimiento('SALIDA')}
                                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs font-medium transition-colors ${tipoMovimiento === 'SALIDA' ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <ArrowUpRight className="w-3 h-3" /> Sal
                                    </button>
                                </div>
                            </div>

                            {/* Cantidad */}
                            <div className="md:col-span-3 space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Cantidad</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={(e) => {
                                        if (['.', ',', '+', '-', 'e', 'E'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    placeholder="0"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            {/* Motivo */}
                            <div className="md:col-span-5 space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Motivo del Ajuste</label>
                                <select
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                                >
                                    <option value="">Seleccionar motivo...</option>
                                    <option value="ROTURA">Rotura</option>
                                    <option value="PERDIDA">Pérdida</option>
                                    <option value="SOBRANTE">Sobrante</option>
                                    <option value="CONSUMO_INTERNO">Consumo Interno</option>
                                    <option value="DIF_CONTEO">Diferencia de Conteo</option>
                                    <option value="DEVOLUCION">Devolución</option>
                                    <option value="ERROR">Error de Registro</option>
                                </select>
                            </div>

                            {/* Observaciones */}
                            <div className="md:col-span-5 space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Observación (Opcional)</label>
                                <input
                                    type="text"
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    placeholder="Nota para este producto..."
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            {/* Botón Agregar */}
                            <div className="md:col-span-2">
                                <button
                                    onClick={handleAddDetalle}
                                    disabled={!selectedProductoId || Number(cantidad) < 1}
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Detalles */}
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3 text-center">Tipo</th>
                                    <th className="px-4 py-3 text-center">Cantidad</th>
                                    <th className="px-4 py-3">Motivo / Obs</th>
                                    <th className="px-4 py-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {detalles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                                            No hay productos agregados al ajuste.
                                        </td>
                                    </tr>
                                ) : (
                                    detalles.map((detalle) => (
                                        <tr key={detalle.id}>
                                            <td className="px-4 py-3 text-slate-900 font-medium">
                                                {detalle.productoNombre}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${detalle.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {detalle.tipo === 'ENTRADA' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                    {detalle.tipo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-600">
                                                {detalle.cantidad}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">{detalle.motivo}</span>
                                                    {detalle.observaciones && <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{detalle.observaciones}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleRemoveDetalle(detalle.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 font-medium hover:bg-white hover:shadow-sm rounded-lg transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || detalles.length === 0}
                        className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                    >
                        {isSubmitting ? 'Guardando...' : 'Confirmar Ajuste'}
                    </button>
                </div>
            </div>
        </div>
    );
}
