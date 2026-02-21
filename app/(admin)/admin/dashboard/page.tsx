import { Search, Bell } from 'lucide-react';
import { AdminStatsGrid } from '@/components/admin/dashboard/AdminStatsGrid';
import { CategoryRankTable } from '@/components/admin/dashboard/CategoryRankTable';
import { SearchGapWidget } from '@/components/admin/dashboard/SearchGapWidget';

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-8">
                <div className="relative w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar productos, tiendas o ID..."
                        className="block w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50"></span>
                    </button>
                    <span className="text-sm font-medium text-slate-600">Mar 24, 2024</span>
                </div>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resumen del Sistema</h1>
                <p className="text-sm text-slate-500 mt-1">Visión general del rendimiento global del marketplace.</p>
            </div>

            {/* KPI Grid */}
            <AdminStatsGrid />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Top Categories Column (2/3) */}
                <CategoryRankTable />

                {/* Search Gap Column (1/3) */}
                <SearchGapWidget />
            </div>
        </div>
    );
}
