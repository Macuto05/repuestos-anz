
import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface CancelarOrdenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (motivo: string) => Promise<void>;
    isLoading: boolean;
}

export function CancelarOrdenModal({ isOpen, onClose, onConfirm, isLoading }: CancelarOrdenModalProps) {
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!motivo.trim()) {
            setError('Debes especificar un motivo para la cancelación.');
            return;
        }
        setError('');
        await onConfirm(motivo);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
                    <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Cancelar Orden
                    </h3>
                    <button onClick={onClose} disabled={isLoading} className="text-red-400 hover:text-red-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-600 mb-4">
                        ¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer.
                    </p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Motivo de cancelación</label>
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none h-24"
                            placeholder="Explica brevemente por qué se cancela la orden..."
                            disabled={isLoading}
                        />
                        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white text-sm font-medium transition-colors"
                    >
                        Volver
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>Procesando...</>
                        ) : (
                            'Confirmar Cancelación'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
