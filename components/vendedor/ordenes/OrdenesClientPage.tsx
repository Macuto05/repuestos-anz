'use client';

import { useState, useEffect, useTransition } from 'react';
import { Plus, Search, FileText, Filter, Eye, CheckCircle, XCircle, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CrearOrdenModal } from './CrearOrdenModal';
import { VerOrdenModal } from './VerOrdenModal';
import { CancelarOrdenModal } from './CancelarOrdenModal';
import { VerMotivoModal } from './VerMotivoModal';
import { recibirOrdenCompra, cancelarOrdenCompra } from '@/lib/actions-ordenes';
import { ConfirmarRecepcionModal } from './ConfirmarRecepcionModal';
import { formatDateVE, formatTimeVE } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { Pagination } from '@/components/ui/Pagination';

interface Orden {
    id: string;
    consecutivo: number;
    proveedor: { nombre: string; correo: string | null };
    usuario: { nombre: string | null };
    totalEstimado: number;
    estado: string;
    observaciones: string | null;
    fechaLlegada: Date | null;
    fechaSolicitud: Date;
    createdAt: Date;
    _count: { detalles: number };
    detalles: any[];
}

interface Producto {
    id: string;
    nombre: string;
    codigoOEM: string | null;
    precio: number;
}

interface Proveedor {
    id: string;
    nombre: string;
}

interface OrdenesClientPageProps {
    ordenesIniciales: any[];
    total: number;
    totalPages: number;
    currentPage: number;
    proveedores: Proveedor[];
    productos: Producto[];
    usuarioId: string;
    tiendaId: string;
}

export function OrdenesClientPage({
    ordenesIniciales,
    total,
    totalPages,
    currentPage,
    proveedores,
    productos,
    usuarioId,
    tiendaId
}: OrdenesClientPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Orden | null>(null);

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    const [isLoadingReceive, setIsLoadingReceive] = useState<string | null>(null);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [orderToReceive, setOrderToReceive] = useState<string | null>(null);

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
    const [isLoadingCancel, setIsLoadingCancel] = useState(false);

    const [isMotivoModalOpen, setIsMotivoModalOpen] = useState(false);
    const [selectedMotivo, setSelectedMotivo] = useState<string | null>(null);

    // Sync search with URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearch) {
            params.set('search', debouncedSearch);
        } else {
            params.delete('search');
        }
        params.set('page', '1');

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    const handleViewMotivo = (motivo: string | null) => {
        setSelectedMotivo(motivo);
        setIsMotivoModalOpen(true);
    };

    const requestCancelOrder = (ordenId: string) => {
        setOrderToCancel(ordenId);
        setIsCancelModalOpen(true);
    };

    const handleCancelOrder = async (motivo: string) => {
        if (!orderToCancel) return;

        setIsLoadingCancel(true);
        try {
            await cancelarOrdenCompra(orderToCancel, motivo);
            router.refresh();
        } catch (error) {
            alert('Error al cancelar la orden');
        } finally {
            setIsLoadingCancel(false);
            setIsCancelModalOpen(false);
        }
    };

    const requestReceiveOrder = (ordenId: string) => {
        setOrderToReceive(ordenId);
        setIsConfirmModalOpen(true);
    };

    const confirmReceiveOrder = async () => {
        if (!orderToReceive) return;

        setIsLoadingReceive(orderToReceive);
        try {
            await recibirOrdenCompra(orderToReceive, tiendaId, usuarioId);
            router.refresh();
        } catch (error) {
            alert('Error al recibir orden');
        } finally {
            setIsLoadingReceive(null);
            setIsConfirmModalOpen(false);
        }
    };

    const handleViewOrder = (orden: Orden) => {
        setSelectedOrder(orden);
        setIsViewModalOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="space-y-6 font-sans text-slate-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pedidos de Compra</h1>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none sm:w-[450px]">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isPending ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar pedido por proveedor, producto o # orden..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                        />
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 font-medium text-sm whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Pedido
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Filtrar por:</span>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Estado:</span>
                        <select
                            value={searchParams.get('estado') || 'TODOS'}
                            onChange={(e) => {
                                const params = new URLSearchParams(searchParams);
                                if (e.target.value === 'TODOS') params.delete('estado');
                                else params.set('estado', e.target.value);
                                params.set('page', '1');
                                startTransition(() => router.replace(`${pathname}?${params.toString()}`));
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none min-w-[140px]"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="PENDIENTE">Pendientes</option>
                            <option value="RECIBIDA">Recibidas</option>
                            <option value="CANCELADA">Canceladas</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Solicitud:</span>
                        <input
                            type="date"
                            lang="es-VE"
                            title="Fecha de Solicitud (Día/Mes/Año)"
                            value={searchParams.get('fechaSolicitud') || ''}
                            onChange={(e) => {
                                const params = new URLSearchParams(searchParams);
                                if (e.target.value) params.set('fechaSolicitud', e.target.value);
                                else params.delete('fechaSolicitud');
                                params.set('page', '1');
                                startTransition(() => router.replace(`${pathname}?${params.toString()}`));
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none hover:bg-white transition-colors cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Entrega:</span>
                        <input
                            type="date"
                            lang="es-VE"
                            title="Fecha de Entrega (Día/Mes/Año)"
                            value={searchParams.get('fechaLlegada') || ''}
                            onChange={(e) => {
                                const params = new URLSearchParams(searchParams);
                                if (e.target.value) params.set('fechaLlegada', e.target.value);
                                else params.delete('fechaLlegada');
                                params.set('page', '1');
                                startTransition(() => router.replace(`${pathname}?${params.toString()}`));
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none hover:bg-white transition-colors cursor-pointer"
                        />
                    </div>

                    {((searchParams.get('estado') && searchParams.get('estado') !== 'TODOS') || searchParams.get('fechaSolicitud') || searchParams.get('fechaLlegada') || searchParams.get('search')) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                const params = new URLSearchParams();
                                params.set('page', '1');
                                startTransition(() => router.replace(`${pathname}?${params.toString()}`));
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-blue-100"
                        >
                            <X className="w-4 h-4" />
                            Limpiar
                        </button>
                    )}
                </div>

                <div className="text-sm font-medium text-slate-400">
                    Mostrando <span className="text-slate-900">{ordenesIniciales.length}</span> de <span className="text-slate-900">{total}</span> pedidos
                </div>
            </div>

            {/* Table Container */}
            <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-opacity ${isPending ? 'opacity-60' : 'opacity-100'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Orden #</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitud</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entrega</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Est.</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ordenesIniciales.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-500 text-sm font-medium">
                                        No se encontraron pedidos.
                                    </td>
                                </tr>
                            ) : (
                                ordenesIniciales.map((orden) => (
                                    <tr key={orden.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 font-mono text-sm font-medium text-slate-600">
                                            #{orden.consecutivo.toString().padStart(4, '0')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-slate-900">{orden.proveedor.nombre}</div>
                                            <div className="text-xs text-slate-500">{orden._count.detalles} productos</div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600">
                                            <div className="flex flex-col" suppressHydrationWarning>
                                                <span className="font-medium text-slate-700">{formatDateVE(orden.fechaSolicitud)}</span>
                                                <span className="text-xs text-slate-400">{formatTimeVE(orden.fechaSolicitud)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600">
                                            {orden.fechaLlegada ? (
                                                <div className="flex flex-col" suppressHydrationWarning>
                                                    <span className="font-medium text-slate-700">{formatDateVE(orden.fechaLlegada)}</span>
                                                    <span className="text-xs text-slate-400">{formatTimeVE(orden.fechaLlegada)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right font-medium text-slate-900">
                                            {formatCurrency(orden.totalEstimado)}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${orden.estado === 'RECIBIDA'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : orden.estado === 'CANCELADA'
                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-100' // Pendiente
                                                }`}>
                                                {orden.estado}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {orden.estado === 'CANCELADA' && (
                                                    <button
                                                        onClick={() => handleViewMotivo(orden.observaciones)}
                                                        disabled={!orden.observaciones}
                                                        className={`p-1.5 rounded transition-colors ${orden.observaciones
                                                            ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                                            : 'text-slate-300 cursor-not-allowed'
                                                            }`}
                                                        title={orden.observaciones ? "Ver motivo de cancelación" : "Sin motivo registrado"}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {orden.estado === 'PENDIENTE' && (
                                                    <>
                                                        <button
                                                            onClick={() => requestReceiveOrder(orden.id)}
                                                            disabled={isLoadingReceive === orden.id}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Recibir Mercancía (Entrada Stock)"
                                                        >
                                                            {isLoadingReceive === orden.id ? (
                                                                <div className="w-4 h-4 border-2 border-blue-600 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4" />
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => requestCancelOrder(orden.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                            title="Cancelar Orden"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleViewOrder(orden)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                                    title="Ver Detalles"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
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

            <CrearOrdenModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                proveedores={proveedores}
                productos={productos}
                usuarioId={usuarioId}
                tiendaId={tiendaId}
                onSuccess={() => {
                    setIsModalOpen(false);
                    router.refresh();
                }}
            />

            <VerOrdenModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                orden={selectedOrder}
            />

            <ConfirmarRecepcionModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmReceiveOrder}
                isLoading={!!isLoadingReceive}
            />

            <CancelarOrdenModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleCancelOrder}
                isLoading={isLoadingCancel}
            />

            <VerMotivoModal
                isOpen={isMotivoModalOpen}
                onClose={() => setIsMotivoModalOpen(false)}
                motivo={selectedMotivo}
            />
        </div>
    );
}
