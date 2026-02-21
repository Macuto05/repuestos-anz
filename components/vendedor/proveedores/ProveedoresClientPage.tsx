'use client';

import { useState, useEffect, useTransition } from 'react';
import { Plus, Search, Pencil, Filter, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { actualizarProveedor } from '@/lib/actions-proveedores';
import { CrearProveedorModal } from './CrearProveedorModal';
import { useDebounce } from '@/hooks/use-debounce';
import { Pagination } from '@/components/ui/Pagination';

interface Proveedor {
    id: string;
    nombre: string;
    rif: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    activo: boolean;
}

interface ProveedoresClientPageProps {
    initialProveedores: any[];
    total: number;
    totalPages: number;
    currentPage: number;
}

export function ProveedoresClientPage({
    initialProveedores,
    total,
    totalPages,
    currentPage
}: ProveedoresClientPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | undefined>(undefined);

    // Sync search with URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearch) {
            params.set('search', debouncedSearch);
        } else {
            params.delete('search');
        }
        params.set('page', '1'); // Reset to page 1 on search

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

    const handleEdit = (proveedor: Proveedor) => {
        setProveedorAEditar(proveedor);
        setIsModalOpen(true);
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        await actualizarProveedor({ id, activo: !currentStatus });
        router.refresh();
    };

    const handleSuccess = () => {
        router.refresh();
    };

    const openNewModal = () => {
        setProveedorAEditar(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 font-sans text-slate-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Mis Proveedores</h1>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none sm:w-[450px]">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isPending ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar proveedor por nombre, RIF o correo..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                        />
                    </div>

                    <button
                        onClick={openNewModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 font-medium text-sm whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Proveedor
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Filtrar por:</span>

                    <select
                        value={searchParams.get('estado') || 'todos'}
                        onChange={(e) => {
                            const params = new URLSearchParams(searchParams);
                            if (e.target.value === 'todos') {
                                params.delete('estado');
                            } else {
                                params.set('estado', e.target.value);
                            }
                            params.set('page', '1');
                            startTransition(() => {
                                router.replace(`${pathname}?${params.toString()}`);
                            });
                        }}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none min-w-[140px]"
                    >
                        <option value="todos">Estado: Todos</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                    </select>

                    {(searchParams.get('estado') || searchParams.get('search')) && (
                        <button
                            onClick={() => {
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
                    Mostrando <span className="text-slate-900">{initialProveedores.length}</span> de <span className="text-slate-900">{total}</span> resultados
                </div>
            </div>

            {/* Table Container */}
            <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-opacity ${isPending ? 'opacity-60' : 'opacity-100'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                                <th className="py-4 px-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {initialProveedores.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500 text-sm font-medium">
                                        No se encontraron resultados
                                    </td>
                                </tr>
                            ) : (
                                initialProveedores.map((proveedor) => (
                                    <tr
                                        key={proveedor.id}
                                        className={`group transition-colors hover:bg-slate-50 ${!proveedor.activo ? 'opacity-90 bg-slate-50/50' : ''}`}
                                    >
                                        {/* Proveedor */}
                                        <td className="py-4 px-6">
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${proveedor.activo ? 'text-slate-900' : 'text-slate-500'}`}>
                                                    {proveedor.nombre}
                                                </p>
                                                {proveedor.rif && (
                                                    <p className="text-xs text-slate-400 font-normal mt-0.5 uppercase">
                                                        {proveedor.rif}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Contacto (Email) */}
                                        <td className="py-4 px-6">
                                            {proveedor.correo ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-600">{proveedor.correo}</span>
                                                    {proveedor.direccion && (
                                                        <span className="text-xs text-slate-400 truncate max-w-[150px] font-normal" title={proveedor.direccion}>
                                                            {proveedor.direccion}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Sin correo</span>
                                            )}
                                        </td>

                                        {/* Teléfono */}
                                        <td className="py-4 px-6">
                                            <span className="text-sm font-medium text-slate-600">
                                                {proveedor.telefono || '-'}
                                            </span>
                                        </td>

                                        {/* Estado */}
                                        <td className="py-4 px-6 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${proveedor.activo
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-red-50 text-red-700 border-red-100' // Red for inactive
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${proveedor.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {proveedor.activo ? 'Activo' : 'Inactivo'}
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(proveedor)}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>

                                                {/* Toggle Switch */}
                                                <button
                                                    onClick={() => handleToggleActive(proveedor.id, proveedor.activo)}
                                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${proveedor.activo ? 'bg-emerald-500' : 'bg-red-500' // Red for inactive as requested
                                                        }`}
                                                    role="switch"
                                                    aria-checked={proveedor.activo}
                                                    title={proveedor.activo ? "Desactivar" : "Reactivar"}
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${proveedor.activo ? 'translate-x-4' : 'translate-x-0'
                                                            }`}
                                                    />
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

            <CrearProveedorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                proveedorAEditar={proveedorAEditar}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
