import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Printer, Box } from "lucide-react";

export default async function DetalleVentaPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const venta = await prisma.venta.findUnique({
        where: { id: params.id },
        include: {
            perfilCliente: {
                include: { usuario: true }
            },
            usuario: true, // Vendedor
            detalles: {
                include: { producto: true }
            },
            pagos: true
        }
    });

    if (!venta) {
        return <div className="p-8 text-center text-slate-500">Venta no encontrada</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/ventas" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Venta #{venta.consecutivo}</h1>
                        <p className="text-sm text-slate-500">{format(new Date(venta.fecha), "dd 'de' MMMM, yyyy - h:mm a", { locale: es })}</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                    <Printer className="w-4 h-4" />
                    Imprimir Recibo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Información del Cliente</h3>
                    {venta.perfilCliente ? (
                        <div className="space-y-2">
                            <p className="font-bold text-slate-900 text-lg">{venta.perfilCliente.usuario.nombre}</p>
                            <p className="text-sm text-slate-600">CI / RIF: <span className="font-medium text-slate-900">{venta.perfilCliente.usuario.cedula}</span></p>
                            {venta.perfilCliente.usuario.telefono && (
                                <p className="text-sm text-slate-600">Teléfono: <span className="font-medium text-slate-900">{venta.perfilCliente.usuario.telefono}</span></p>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">Venta Anónima (Mostrador)</p>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Vendedor</h3>
                        <p className="font-medium text-slate-900 mb-4">{venta.usuario.nombre}</p>
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Resumen Financiero</h3>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold">Total USD</p>
                                <p className="text-3xl font-black text-emerald-600">${Number(venta.totalUSD).toFixed(2)}</p>
                            </div>
                            {venta.totalBs && (
                                <div className="text-right">
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Total Bs</p>
                                    <p className="text-xl font-bold text-slate-800">Bs {Number(venta.totalBs).toFixed(2)}</p>
                                    <p className="text-[10px] text-blue-500 font-medium">Tasa: Bs {Number(venta.tasaDolar).toFixed(2)} / $</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Box className="w-4 h-4 text-blue-600" />
                        Productos Vendidos
                    </h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-slate-100 text-slate-400">
                        <tr>
                            <th className="px-6 py-3 font-medium">Producto</th>
                            <th className="px-6 py-3 font-medium text-center">Cantidad</th>
                            <th className="px-6 py-3 font-medium text-right">Precio Unit. (USD)</th>
                            <th className="px-6 py-3 font-medium text-right">Subtotal (USD)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {venta.detalles.map((d) => (
                            <tr key={d.id}>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-900">{d.producto.nombre}</p>
                                    <p className="text-xs text-slate-500">{d.producto.codigoOEM}</p>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-700">{d.cantidad}</td>
                                <td className="px-6 py-4 text-right text-slate-600">${Number(d.precioUnitario).toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-900">${Number(d.subtotal).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Método de Pago: <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{venta.metodoPago.replace('_', ' ')}</span></h3>

                {venta.metodoPago === 'MIXTO' && venta.pagos.length > 0 && (
                    <div className="mt-4 border border-slate-100 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-4 py-2 font-medium">Método</th>
                                    <th className="px-4 py-2 font-medium">Monto USD ($)</th>
                                    <th className="px-4 py-2 font-medium">Monto Bs</th>
                                    <th className="px-4 py-2 font-medium">Referencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {venta.pagos.map((pago) => (
                                    <tr key={pago.id}>
                                        <td className="px-4 py-2 font-bold text-slate-700">{pago.metodoPago.replace('_', ' ')}</td>
                                        <td className="px-4 py-2 text-emerald-600 font-bold">${Number(pago.montoUSD).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-slate-600">{pago.montoBs ? `Bs ${Number(pago.montoBs).toFixed(2)}` : '-'}</td>
                                        <td className="px-4 py-2 text-slate-500 font-mono text-xs">{pago.referencia || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {venta.observaciones && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Observaciones</h4>
                    <p className="text-sm text-amber-900">{venta.observaciones}</p>
                </div>
            )}
        </div>
    );
}
