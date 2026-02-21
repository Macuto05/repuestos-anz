'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Users, Store, CheckCircle } from 'lucide-react';
import { VendedoresTable } from '@/components/admin/vendedores/VendedoresTable';
import { CreateVendedorModal } from '@/components/admin/vendedores/CreateVendedorModal';

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

interface VendedoresClientPageProps {
    vendedores: Vendedor[];
}

export function VendedoresClientPage({ vendedores }: VendedoresClientPageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null);
    const router = useRouter();

    const handleEdit = (vendedor: Vendedor) => {
        setSelectedVendedor(vendedor);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setSelectedVendedor(null);
    };

    const handleSuccess = () => {
        // Refresh data then close modal
        router.refresh();
        // Note: router.refresh() is async but doesn't return a promise in older versions, 
        // in newer it does. Visual feedback is usually handled by modal loading state.
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vendedores</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Gestiona los usuarios vendedores del sistema.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedVendedor(null);
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <UserPlus className="w-4 h-4" />
                    Nuevo Vendedor
                </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-col justify-between">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Vendedores</p>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-slate-900">{vendedores.length}</p>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-col justify-between">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Activos</p>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-emerald-600">
                            {vendedores.filter(v => v.activo).length}
                        </p>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-col justify-between">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Con Tienda</p>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-blue-600">
                            {vendedores.filter(v => v.tienda).length}
                        </p>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Store className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <VendedoresTable
                vendedores={vendedores}
                onEdit={handleEdit}
            />

            {/* Modal */}
            <CreateVendedorModal
                isOpen={isModalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                vendedorToEdit={selectedVendedor}
            />
        </>
    );
}
