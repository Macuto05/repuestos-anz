'use client';

import { useState, useTransition } from 'react';
import { toggleVendedorActivo } from '@/lib/actions-vendedores';
import { Pencil, Power } from 'lucide-react';

type Vendedor = {
    id: string;
    email: string;
    cedula: string | null;
    nombre: string;
    telefono: string | null;
    activo: boolean;
    createdAt: Date;
    tienda: { nombre: string } | null;
};

interface VendedoresTableProps {
    vendedores: Vendedor[];
    onEdit?: (v: Vendedor) => void;
}

export function VendedoresTable({ vendedores, onEdit }: VendedoresTableProps) {
    const [isPending, startTransition] = useTransition();
    const [togglingId, setTogglingId] = useState<string | null>(null);

    function handleToggle(id: string, currentActivo: boolean) {
        setTogglingId(id);
        startTransition(async () => {
            await toggleVendedorActivo(id, !currentActivo);
            setTogglingId(null);
        });
    }

    if (vendedores.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No hay vendedores</h3>
                <p className="text-sm text-slate-500">Comienza agregando tu primer vendedor al sistema.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                Vendedor
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                Cédula
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                Email
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                Teléfono
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                Tienda
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                Estado
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                Fecha registro
                            </th>
                            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {vendedores.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-slate-900">{v.nombre}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-slate-600 font-mono">{v.cedula || <span className="text-slate-400 italic">—</span>}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-slate-600">{v.email}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-slate-600">
                                        {v.telefono || <span className="text-slate-400 italic">—</span>}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {v.tienda ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {v.tienda.nombre}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">Sin tienda</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {v.activo ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                            Inactivo
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-slate-500">
                                        {new Date(v.createdAt).toLocaleDateString('es-VE', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            timeZone: 'America/Caracas',
                                        })}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit && onEdit(v)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggle(v.id, v.activo)}
                                            disabled={isPending && togglingId === v.id}
                                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${v.activo
                                                ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                                : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                }`}
                                            title={v.activo ? 'Desactivar' : 'Activar'}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
