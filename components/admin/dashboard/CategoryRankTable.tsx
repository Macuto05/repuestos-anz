import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function CategoryRankTable() {
    return (
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">Top 10 Categorías Más Buscadas</h3>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Ver Reporte Completo</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Rango</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4">Volumen</th>
                            <th className="px-6 py-4">Crecimiento %</th>
                            <th className="px-6 py-4 text-right">Conversión</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-300">01</td>
                            <td className="px-6 py-4 font-medium text-slate-900">Frenos y Discos</td>
                            <td className="px-6 py-4 text-slate-600">1,240</td>
                            <td className="px-6 py-4 text-green-600 font-medium flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-1" /> 18.2%
                            </td>
                            <td className="px-6 py-4 text-right text-slate-900">4.2%</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-300">02</td>
                            <td className="px-6 py-4 font-medium text-slate-900">Filtros de Aceite</td>
                            <td className="px-6 py-4 text-slate-600">982</td>
                            <td className="px-6 py-4 text-green-600 font-medium flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-1" /> 5.4%
                            </td>
                            <td className="px-6 py-4 text-right text-slate-900">8.1%</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-300">03</td>
                            <td className="px-6 py-4 font-medium text-slate-900">Baterías 12V</td>
                            <td className="px-6 py-4 text-slate-600">854</td>
                            <td className="px-6 py-4 text-red-500 font-medium flex items-center">
                                <ArrowDownRight className="w-3 h-3 mr-1" /> 2.1%
                            </td>
                            <td className="px-6 py-4 text-right text-slate-900">3.5%</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-300">04</td>
                            <td className="px-6 py-4 font-medium text-slate-900">Amortiguadores</td>
                            <td className="px-6 py-4 text-slate-600">721</td>
                            <td className="px-6 py-4 text-green-600 font-medium flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-1" /> 11.5%
                            </td>
                            <td className="px-6 py-4 text-right text-slate-900">2.8%</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-300">05</td>
                            <td className="px-6 py-4 font-medium text-slate-900">Luces LED H4</td>
                            <td className="px-6 py-4 text-slate-600">645</td>
                            <td className="px-6 py-4 text-green-600 font-medium flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-1" /> 24.0%
                            </td>
                            <td className="px-6 py-4 text-right text-slate-900">5.9%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
