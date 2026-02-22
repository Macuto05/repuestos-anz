import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function HistorialVentasPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const tienda = await prisma.tienda.findUnique({
        where: { usuarioId: session.user.id }
    });

    if (!tienda) {
        return <div>Tienda no configurada</div>;
    }

    const ventas = await prisma.venta.findMany({
        where: { tiendaId: tienda.id },
        include: {
            perfilCliente: {
                include: { usuario: true }
            },
            pagos: true
        },
        orderBy: { fecha: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Historial de Ventas</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-medium">Consecutivo</th>
                            <th className="px-6 py-4 font-medium">Fecha</th>
                            <th className="px-6 py-4 font-medium">Cliente</th>
                            <th className="px-6 py-4 font-medium text-right">Total USD</th>
                            <th className="px-6 py-4 font-medium text-right">Total Bs</th>
                            <th className="px-6 py-4 font-medium text-center">Método</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {ventas.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No se encontraron ventas registradas</td>
                            </tr>
                        ) : (
                            ventas.map((venta) => (
                                <tr key={venta.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-blue-600">
                                        #{venta.consecutivo}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {format(new Date(venta.fecha), "d MMM yyyy, h:mm a", { locale: es })}
                                    </td>
                                    <td className="px-6 py-4 text-slate-900 font-medium">
                                        {venta.perfilCliente ? venta.perfilCliente.usuario.nombre : "Venta Anónima"}
                                    </td>
                                    <td className="px-6 py-4 text-emerald-600 font-bold text-right">
                                        ${Number(venta.totalUSD).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-right">
                                        {venta.totalBs ? `Bs ${Number(venta.totalBs).toFixed(2)}` : '-'}
                                        {venta.tasaDolar && <span className="block text-[10px] text-slate-400 font-normal">Tasa: {Number(venta.tasaDolar).toFixed(2)}</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${venta.metodoPago === 'MIXTO' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {venta.metodoPago.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/dashboard/ventas/${venta.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            Ver Detalle
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
