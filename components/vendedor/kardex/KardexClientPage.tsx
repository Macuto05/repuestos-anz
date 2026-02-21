'use client';

import { useState, useEffect, useTransition } from 'react';
import { Search, Filter, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, FileText, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { formatDateVE, formatTimeVE } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { Pagination } from '@/components/ui/Pagination';

// Tipos adaptados de lo que devuelve el server action
interface Movimiento {
    id: string;
    fecha: Date;
    tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRASLADO';
    referencia: string | null;
    observaciones: string | null;
    usuario: { nombre: string };
    ordenCompra?: { consecutivo: number; proveedor: { nombre: string } } | null;
    ajuste?: { consecutivo: number; motivo: string | null } | null;
    detalles: {
        id: string;
        cantidad: number;
        stockResultante: number;
        producto: {
            nombre: string;
            codigoOEM: string | null;
            marcaRepuesto: string;
        };
    }[];
}

interface Producto {
    id: string;
    nombre: string;
    codigoOEM: string | null;
}

interface KardexClientPageProps {
    movimientosIniciales: Movimiento[];
    total: number;
    totalPages: number;
    currentPage: number;
    productos: Producto[];
    tiendaId: string;
}

export function KardexClientPage({
    movimientosIniciales,
    total,
    totalPages,
    currentPage,
    productos,
    tiendaId
}: KardexClientPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Filtros de UI sincrónicos
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    const [filtroTipo, setFiltroTipo] = useState(searchParams.get('tipo') || '');
    const [fechaInicio, setFechaInicio] = useState(searchParams.get('fechaInicio') || '');
    const [fechaFin, setFechaFin] = useState(searchParams.get('fechaFin') || '');

    // Sync filters with URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams);

        if (debouncedSearch) params.set('search', debouncedSearch);
        else params.delete('search');

        if (filtroTipo) params.set('tipo', filtroTipo);
        else params.delete('tipo');

        if (fechaInicio) params.set('fechaInicio', fechaInicio);
        else params.delete('fechaInicio');

        if (fechaFin && fechaInicio) params.set('fechaFin', fechaFin);
        else params.delete('fechaFin');

        params.set('page', '1'); // Reset to page 1 on filter change

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }, [debouncedSearch, filtroTipo, fechaInicio, fechaFin]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="space-y-6 font-sans text-slate-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Kardex de Inventario</h1>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none sm:w-[450px]">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isPending ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar movimiento por referencia o producto..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Filtrar por:</span>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Tipo:</span>
                        <select
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none min-w-[140px]"
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="ENTRADA">Entradas</option>
                            <option value="SALIDA">Salidas</option>
                            <option value="AJUSTE">Ajustes</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Desde:</span>
                        <input
                            type="date"
                            lang="es-VE"
                            value={fechaInicio}
                            onChange={(e) => {
                                setFechaInicio(e.target.value);
                                if (!e.target.value) setFechaFin('');
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none cursor-pointer hover:bg-white transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium whitespace-nowrap ${!fechaInicio ? 'text-slate-300' : 'text-slate-500'}`}>Hasta:</span>
                        <input
                            type="date"
                            lang="es-VE"
                            value={fechaFin}
                            disabled={!fechaInicio}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className={`bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none transition-all ${!fechaInicio ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white'}`}
                        />
                    </div>

                    {(filtroTipo || fechaInicio || searchTerm) && (
                        <button
                            onClick={() => {
                                setFiltroTipo('');
                                setFechaInicio('');
                                setFechaFin('');
                                setSearchTerm('');
                                const params = new URLSearchParams();
                                params.set('page', '1');
                                startTransition(() => {
                                    router.replace(`${pathname}?${params.toString()}`);
                                });
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-blue-100"
                        >
                            <X className="w-4 h-4" />
                            Limpiar
                        </button>
                    )}
                </div>

                <div className="text-sm font-medium text-slate-400">
                    Mostrando <span className="text-slate-900">{movimientosIniciales.length}</span> de <span className="text-slate-900">{total}</span> registros
                </div>
            </div>

            {/* Table Container */}
            <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-opacity ${isPending ? 'opacity-60' : 'opacity-100'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Referencia</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalles del Movimiento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {movimientosIniciales.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-500 text-sm font-medium">
                                        No se encontraron movimientos registrados con esos filtros.
                                    </td>
                                </tr>
                            ) : (
                                movimientosIniciales.map((mov) => (
                                    <tr key={mov.id} className="group hover:bg-slate-50 transition-colors">
                                        {/* Fecha */}
                                        <td className="py-4 px-6 align-top w-40">
                                            <div className="flex flex-col text-sm" suppressHydrationWarning>
                                                <span className="font-semibold text-slate-700">{formatDateVE(mov.fecha)}</span>
                                                <span className="text-xs text-slate-400">{formatTimeVE(mov.fecha)}</span>
                                            </div>
                                        </td>

                                        {/* Referencia */}
                                        <td className="py-4 px-6 align-top w-32">
                                            <div className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded w-fit border border-slate-200 shadow-sm">
                                                {mov.ordenCompra ? `OC-${mov.ordenCompra.consecutivo}` :
                                                    mov.ajuste ? `AJ-${mov.ajuste.consecutivo}` :
                                                        mov.referencia || 'SIN REF'}
                                            </div>
                                        </td>

                                        {/* Tipo Badge */}
                                        <td className="py-4 px-6 align-top w-32">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${mov.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-500/5' :
                                                mov.tipo === 'SALIDA' ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm shadow-blue-500/5' :
                                                    'bg-amber-50 text-amber-700 border-amber-100 shadow-sm shadow-amber-500/5'
                                                }`}>
                                                {mov.tipo === 'ENTRADA' && <ArrowDownLeft className="w-3 h-3" />}
                                                {mov.tipo === 'SALIDA' && <ArrowUpRight className="w-3 h-3" />}
                                                {mov.tipo === 'AJUSTE' && <ArrowRightLeft className="w-3 h-3" />}
                                                {mov.tipo}
                                            </span>
                                        </td>

                                        {/* Productos Afectados */}
                                        <td className="py-4 px-6 align-top">
                                            <MovimientoDetalles detalles={mov.detalles} tipo={mov.tipo} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-2 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex items-center justify-end">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Subcomponente para manejar el desplegable de detalles
function MovimientoDetalles({ detalles, tipo }: { detalles: Movimiento['detalles'], tipo: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const primerDetalle = detalles[0];
    const restosDetalles = detalles.slice(1);
    const hasMore = restosDetalles.length > 0;

    if (!primerDetalle) return <span className="text-slate-400 text-sm italic">Sin detalles registrados</span>;

    const DetalleItem = ({ detalle }: { detalle: typeof primerDetalle }) => (
        <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all hover:shadow-sm">
            <div className="flex-1 min-w-0 pr-4">
                <div className="font-semibold text-sm text-slate-800 truncate">{detalle.producto.nombre}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">
                    {detalle.producto.codigoOEM || 'S/OEM'} • {detalle.producto.marcaRepuesto}
                </div>
            </div>
            <div className="text-right whitespace-nowrap">
                <div className={`font-black text-sm ${tipo === 'ENTRADA' ? 'text-emerald-600' :
                    tipo === 'SALIDA' ? 'text-blue-600' :
                        'text-amber-600'
                    }`}>
                    {tipo === 'ENTRADA' ? '+' :
                        tipo === 'SALIDA' ? '-' :
                            detalle.cantidad > 0 ? '+' : ''}
                    {detalle.cantidad}
                </div>
                <div className="text-[10px] font-bold text-slate-300">
                    STK: {detalle.stockResultante}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-1">
            <DetalleItem detalle={primerDetalle} />

            {hasMore && (
                <>
                    {isExpanded && (
                        <div className="pl-4 border-l-2 border-slate-100 space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {restosDetalles.map(detalle => (
                                <DetalleItem key={detalle.id} detalle={detalle} />
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 mt-2 transition-colors group px-2 py-1.5 rounded-lg hover:bg-slate-50 w-full"
                    >
                        <span className="text-[10px] uppercase tracking-widest border-b border-transparent group-hover:border-blue-200">
                            {isExpanded ? 'Colapsar detalles' : `Ver ${restosDetalles.length} productos más`}
                        </span>
                    </button>
                </>
            )}
        </div>
    );
}
