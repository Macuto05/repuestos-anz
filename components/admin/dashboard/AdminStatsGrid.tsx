import { Store, Package, History, CheckCircle2, ArrowUpRight } from 'lucide-react';

export function AdminStatsGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Tiendas */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Store className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +2
                    </span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tiendas</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">25</p>
            </div>

            {/* Total Productos */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +12%
                    </span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Productos</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">1,247</p>
            </div>

            {/* Búsquedas */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <History className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="flex items-center text-xs font-medium text-slate-400">
                        <History className="w-3 h-3 mr-1" />
                        30d
                    </span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Búsquedas 30 días</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">3,589</p>
            </div>

            {/* Tiendas Activas (Progress) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="flex items-center text-xs font-bold text-indigo-600">
                        92%
                    </span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiendas Activas</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">23/25</p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                </div>
            </div>
        </div>
    );
}
