import { Search, Megaphone } from 'lucide-react';

export function SearchGapWidget() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                    <Search className="w-4 h-4 text-red-500" />
                    <h3 className="font-semibold text-slate-900">Búsquedas Sin Resultados</h3>
                </div>
                <p className="text-xs text-slate-500">Términos críticos que necesitan inventario.</p>
            </div>

            <div className="p-6 flex-1 space-y-6">
                {/* Item 1 */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">"Filtro aceite Toyota 2024"</p>
                            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Urgente</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">42x</span>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                        <Megaphone className="w-3 h-3" />
                        Notificar Tiendas
                    </button>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Item 2 */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">"Kit embrague Mazda CX5"</p>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Normal</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">28x</span>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                        <Megaphone className="w-3 h-3" />
                        Notificar Tiendas
                    </button>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Item 3 */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">"Bujías Iridium Tesla"</p>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Baja</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">12x</span>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                        <Megaphone className="w-3 h-3" />
                        Notificar Tiendas
                    </button>
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
                <button className="w-full text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wide">
                    Analizar todas las brechas
                </button>
            </div>
        </div>
    );
}
