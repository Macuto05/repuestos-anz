'use client';

import { useState, useEffect, useTransition } from 'react';
import { Plus, Search, Filter, FileText, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CrearAjusteModal } from './CrearAjusteModal';
import { formatDateVE, formatTimeVE } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { Pagination } from '@/components/ui/Pagination';

// Types simplified for display
interface Ajuste {
    id: string;
    consecutivo: number;
    fecha: Date;
    motivo: string | null;
    observaciones: string | null;
    usuario: { nombre: string };
    detalles: {
        id: string;
        cantidad: number;
        tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
        producto: { nombre: string; codigoOEM: string | null };
    }[];
}

interface Producto {
    id: string;
    nombre: string;
    codigoOEM: string | null;
    stock: number;
}

interface AjustesClientPageProps {
    ajustesIniciales: any[];
    total: number;
    totalPages: number;
    currentPage: number;
    productosDisponibles: Producto[];
    usuarioId: string;
    tiendaId: string;
}

export function AjustesClientPage({
    ajustesIniciales,
    total,
    totalPages,
    currentPage,
    productosDisponibles,
    usuarioId,
    tiendaId
}: AjustesClientPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    const [filtroMotivo, setFiltroMotivo] = useState(searchParams.get('motivo') || '');
    const [filtroTipo, setFiltroTipo] = useState(searchParams.get('tipo') || '');
    const [fechaInicio, setFechaInicio] = useState(searchParams.get('fechaInicio') || '');
    const [fechaFin, setFechaFin] = useState(searchParams.get('fechaFin') || '');
    const [observacionModal, setObservacionModal] = useState<string | null>(null);

    // Sync filters with URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams);

        if (debouncedSearch) params.set('search', debouncedSearch);
        else params.delete('search');

        if (filtroMotivo) params.set('motivo', filtroMotivo);
        else params.delete('motivo');

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
    }, [debouncedSearch, filtroMotivo, filtroTipo, fechaInicio, fechaFin]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        router.refresh();
    };

    return (
        <div className="space-y-6 font-sans text-slate-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Ajustes de Inventario</h1>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none sm:w-[450px]">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isPending ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar ajuste por producto o referencia..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                        />
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 font-medium text-sm whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Ajuste
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Filtrar por:</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Motivo:</span>
                        <select
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none min-w-[140px]"
                            value={filtroMotivo}
                            onChange={(e) => setFiltroMotivo(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="ROTURA">Rotura</option>
                            <option value="PERDIDA">Pérdida</option>
                            <option value="SOBRANTE">Sobrante</option>
                            <option value="CONSUMO_INTERNO">Consumo Interno</option>
                            <option value="DIF_CONTEO">Dif. Conteo</option>
                            <option value="DEVOLUCION">Devolución</option>
                            <option value="ERROR">Error</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Tipo:</span>
                        <select
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none min-w-[120px]"
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="ENTRADA">Entradas</option>
                            <option value="SALIDA">Salidas</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Desde:</span>
                        <input
                            type="date"
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
                            value={fechaFin}
                            disabled={!fechaInicio}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className={`bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none transition-all ${!fechaInicio ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white'}`}
                        />
                    </div>

                    {(filtroMotivo || filtroTipo || fechaInicio || searchTerm) && (
                        <button
                            onClick={() => {
                                setFiltroMotivo('');
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
                    Mostrando <span className="text-slate-900">{ajustesIniciales.length}</span> de <span className="text-slate-900">{total}</span> registros
                </div>
            </div>

            {/* List / Table */}
            <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-opacity ${isPending ? 'opacity-60' : 'opacity-100'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Referencia</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalles del Movimiento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ajustesIniciales.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-500 text-sm font-medium">
                                        No se encontraron ajustes.
                                    </td>
                                </tr>
                            ) : (
                                ajustesIniciales.map((ajuste) => {
                                    return (
                                        <tr key={ajuste.id} className="group hover:bg-slate-50 transition-colors">
                                            {/* Fecha */}
                                            <td className="py-4 px-6 align-top w-32">
                                                <div className="flex flex-col text-sm" suppressHydrationWarning>
                                                    <span className="font-medium text-slate-700">{formatDateVE(ajuste.fecha)}</span>
                                                    <span className="text-xs text-slate-400">{formatTimeVE(ajuste.fecha)}</span>
                                                </div>
                                            </td>

                                            {/* Referencia */}
                                            <td className="py-4 px-6 align-top w-32">
                                                <div className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded w-fit">
                                                    AJ-{ajuste.consecutivo}
                                                </div>
                                            </td>

                                            {/* Motivo e Icono de Observaciones */}
                                            <td className="py-4 px-6 align-top w-48">
                                                <div className="text-sm font-medium text-slate-900">
                                                    {ajuste.motivo ? ajuste.motivo.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) : 'Sin motivo'}
                                                </div>

                                                <div className="mt-2">
                                                    <button
                                                        onClick={() => {
                                                            if (ajuste.observaciones) {
                                                                setObservacionModal(ajuste.observaciones);
                                                            }
                                                        }}
                                                        disabled={!ajuste.observaciones}
                                                        title={ajuste.observaciones || 'Sin observaciones'}
                                                        className={`p-1 rounded transition-colors ${ajuste.observaciones
                                                            ? 'text-blue-500 hover:bg-blue-50 cursor-pointer'
                                                            : 'text-slate-300 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Detalles (Productos) */}
                                            <td className="py-4 px-6 align-top">
                                                <AjusteDetalles detalles={ajuste.detalles} />
                                            </td>
                                        </tr>
                                    );
                                })
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

            <CrearAjusteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productos={productosDisponibles}
                usuarioId={usuarioId}
                tiendaId={tiendaId}
                onSuccess={handleSuccess}
            />

            {/* Modal de Observaciones */}
            {observacionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                Observaciones del Ajuste
                            </h3>
                            <button
                                onClick={() => setObservacionModal(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                                {observacionModal}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setObservacionModal(null)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Subcomponente para manejar el desplegable de detalles (similar a Kardex)
function AjusteDetalles({ detalles }: { detalles: Ajuste['detalles'] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const primerDetalle = detalles[0];
    const restosDetalles = detalles.slice(1);
    const hasMore = restosDetalles.length > 0;

    if (!primerDetalle) return <span className="text-slate-400 text-sm">Sin detalles</span>;

    const DetalleItem = ({ detalle }: { detalle: typeof primerDetalle }) => (
        <div className="flex items-center justify-between p-2 rounded hover:bg-white border border-transparent hover:border-slate-100 transition-all">
            <div>
                <div className="font-medium text-sm text-slate-900">{detalle.producto.nombre}</div>
                <div className="text-xs text-slate-500">
                    {detalle.producto.codigoOEM || 'Sin Código'}
                </div>
            </div>
            <div className="text-right">
                <div className={`font-bold text-sm ${detalle.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                    {detalle.tipo === 'ENTRADA' ? '+' : '-'}
                    {detalle.cantidad}
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                    {detalle.tipo === 'ENTRADA' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {detalle.tipo}
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
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 mt-1 transition-colors group px-2 py-1 rounded hover:bg-slate-50 w-full"
                    >
                        <span className="text-xs underline decoration-dotted underline-offset-2 group-hover:decoration-blue-400">
                            {isExpanded ? 'Ver menos' : `Ver ${restosDetalles.length} más...`}
                        </span>
                    </button>
                </>
            )}
        </div>
    );
}
