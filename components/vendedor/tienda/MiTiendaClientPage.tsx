'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, Phone, MessageCircle, MapPin, Map, FileText, Pencil, ExternalLink, Clock } from 'lucide-react';
import { CreateTiendaModal } from '@/components/vendedor/tienda/CreateTiendaModal';

interface Tienda {
    id: string;
    nombre: string;
    telefono: string;
    whatsapp: string | null;
    ciudad: string;
    estado: string;
    direccion: string;
    googleMapsUrl: string | null;
    horario: any;
    activa: boolean;
    createdAt: string;
}

interface MiTiendaClientPageProps {
    tienda: Tienda | null;
}

export function MiTiendaClientPage({ tienda }: MiTiendaClientPageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tiendaToEdit, setTiendaToEdit] = useState<Tienda | null>(null);
    const router = useRouter();

    const handleEdit = () => {
        if (tienda) {
            setTiendaToEdit(tienda);
            setIsModalOpen(true);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setTiendaToEdit(null);
    };

    const handleSuccess = () => {
        router.refresh();
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mi Tienda</h1>
                    </div>
                    {!tienda && (
                        <button
                            onClick={() => {
                                setTiendaToEdit(null);
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 font-medium text-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Tienda
                        </button>
                    )}
                </div>

                {/* Content */}
                {!tienda ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                            <Store className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No tienes tienda registrada</h3>
                        <p className="text-sm text-slate-500 mb-6">Crea tu tienda para empezar a gestionar productos y vender.</p>
                        <button
                            onClick={() => {
                                setTiendaToEdit(null);
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Crear mi tienda
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {/* Table Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Datos de la tienda</h2>
                            <button
                                onClick={handleEdit}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                Editar
                            </button>
                        </div>

                        {/* Data Table */}
                        <table className="w-full">
                            <tbody className="divide-y divide-slate-50">
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Store className="w-4 h-4" />
                                            Nombre
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{tienda.nombre}</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Phone className="w-4 h-4" />
                                            Teléfono
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{tienda.telefono}</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                        {tienda.whatsapp || <span className="text-slate-400 italic">No registrado</span>}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Map className="w-4 h-4" />
                                            Estado
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{tienda.estado}</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <MapPin className="w-4 h-4" />
                                            Ciudad
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{tienda.ciudad}</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <FileText className="w-4 h-4" />
                                            Dirección
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{tienda.direccion}</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <MapPin className="w-4 h-4" />
                                            Google Maps
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tienda.googleMapsUrl ? (
                                            <div className="w-full max-w-md h-64 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                                <iframe
                                                    src={tienda.googleMapsUrl}
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0 }}
                                                    allowFullScreen={true}
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">No registrado</span>
                                        )}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 w-48 align-top">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Clock className="w-4 h-4" />
                                            Horario
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tienda.horario ? (
                                            <div className="text-sm text-slate-600 space-y-1">
                                                {(() => {
                                                    try {
                                                        const horario = tienda.horario as any;
                                                        const days = [
                                                            { key: 'lunes', label: 'Lun' },
                                                            { key: 'martes', label: 'Mar' },
                                                            { key: 'miercoles', label: 'Mié' },
                                                            { key: 'jueves', label: 'Jue' },
                                                            { key: 'viernes', label: 'Vie' },
                                                            { key: 'sabado', label: 'Sáb' },
                                                            { key: 'domingo', label: 'Dom' },
                                                        ];

                                                        // Group days with same schedule for cleaner display
                                                        // This is a simple list for now
                                                        return days.map(day => {
                                                            const config = horario[day.key];
                                                            if (!config) return null;
                                                            return (
                                                                <div key={day.key} className="flex items-center gap-2">
                                                                    <span className="font-medium w-8">{day.label}:</span>
                                                                    {config.abierto ? (
                                                                        <span>{config.horaApertura} - {config.horaCierre}</span>
                                                                    ) : (
                                                                        <span className="text-slate-400 italic">Cerrado</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        });
                                                    } catch (e) {
                                                        return <span className="italic text-slate-400">Error al mostrar horario</span>;
                                                    }
                                                })()}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">No configurado</span>
                                        )}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            Estado
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tienda.activa ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                Activa
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                                Inactiva
                                            </span>
                                        )}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            Fecha de registro
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(tienda.createdAt).toLocaleDateString('es-VE', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                            timeZone: 'America/Caracas',
                                        })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                <CreateTiendaModal
                    isOpen={isModalOpen}
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                    tiendaToEdit={tiendaToEdit}
                />
            </div>
        </>
    );
}
