
interface ConfirmarRecepcionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}

export function ConfirmarRecepcionModal({ isOpen, onClose, onConfirm, isLoading }: ConfirmarRecepcionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar Recepción</h3>
                <p className="text-sm text-slate-600 mb-6">
                    ¿Estás seguro de recibir esta mercancía? Esto aumentará automáticamente el stock de todos los productos incluidos en la orden.
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            'Confirmar y Recibir'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
