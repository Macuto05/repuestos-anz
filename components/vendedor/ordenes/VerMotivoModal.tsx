
import { X, Info } from 'lucide-react';

interface VerMotivoModalProps {
    isOpen: boolean;
    onClose: () => void;
    motivo: string | null;
}

export function VerMotivoModal({ isOpen, onClose, motivo }: VerMotivoModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        Motivo de Cancelación
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {motivo || 'No se registró un motivo específico para esta cancelación.'}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
