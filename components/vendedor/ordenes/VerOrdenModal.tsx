
import { X, Package, Calendar, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDateTimeVE } from '@/lib/utils';

interface DetalleOrden {
    id: string;
    cantidadSolicitada: number;
    costoUnitario: number;
    producto: {
        nombre: string;
        codigoOEM: string | null;
    };
}

interface Orden {
    id: string;
    consecutivo: number;
    proveedor: { nombre: string; correo: string | null };
    usuario: { nombre: string | null };
    totalEstimado: any;
    estado: string;
    fechaSolicitud: Date | string;
    fechaLlegada?: Date | string | null;
    createdAt: Date | string;
    detalles: DetalleOrden[];
}

interface VerOrdenModalProps {
    isOpen: boolean;
    onClose: () => void;
    orden: Orden | null;
}

export function VerOrdenModal({ isOpen, onClose, orden }: VerOrdenModalProps) {
    if (!isOpen || !orden) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-slate-900">
                                Orden #{orden.consecutivo.toString().padStart(4, '0')}
                            </h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${orden.estado === 'RECIBIDA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                orden.estado === 'CANCELADA' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}>
                                {orden.estado}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            {orden.proveedor.nombre}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block text-xs font-medium mb-1">Fecha de Solicitud</span>
                            <div className="flex items-center gap-2 font-medium text-slate-700" suppressHydrationWarning>
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {formatDateTimeVE(orden.fechaSolicitud)}
                            </div>
                        </div>
                        {orden.fechaLlegada && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-slate-400 block text-xs font-medium mb-1">Fecha de Entrega</span>
                                <div className="flex items-center gap-2 font-medium text-slate-700" suppressHydrationWarning>
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {formatDateTimeVE(orden.fechaLlegada)}
                                </div>
                            </div>
                        )}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block text-xs font-medium mb-1">Creado por</span>
                            <div className="font-medium text-slate-700">
                                {orden.usuario?.nombre || 'Desconocido'}
                            </div>
                        </div>
                    </div>

                    {/* Productos Table */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-500" />
                            Productos Solicitados
                        </h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Producto</th>
                                        <th className="px-4 py-3 text-right">Cant.</th>
                                        <th className="px-4 py-3 text-right">Costo Unit.</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orden.detalles.map((detalle) => (
                                        <tr key={detalle.id}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{detalle.producto.nombre}</div>
                                                <div className="text-xs text-slate-500">{detalle.producto.codigoOEM || 'S/N'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                                                {detalle.cantidadSolicitada}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600">
                                                {formatCurrency(detalle.costoUnitario)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                {formatCurrency(detalle.cantidadSolicitada * Number(detalle.costoUnitario))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold text-slate-900">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right">Total Estimado:</td>
                                        <td className="px-4 py-3 text-right text-blue-600">
                                            {formatCurrency(orden.totalEstimado)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
