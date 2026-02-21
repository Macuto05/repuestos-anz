import Link from 'next/link';
import Image from 'next/image';
import { Package, Store, MapPin } from 'lucide-react';

interface ProductCardProps {
    id: string;
    nombre: string;
    codigoOEM: string | null;
    marcaRepuesto: string;
    precio: number;
    stock: number;
    imagenPrincipal: string | null;
    tiendaNombre: string;
    tiendaCiudad: string;
    tiendaEstado: string;
}

export function ProductCard({
    id, nombre, codigoOEM, marcaRepuesto, precio, stock,
    imagenPrincipal, tiendaNombre, tiendaCiudad, tiendaEstado,
}: ProductCardProps) {
    const stockLabel = stock <= 0
        ? null
        : stock <= 5
            ? { text: 'STOCK LIMITADO', color: 'bg-amber-500' }
            : { text: 'EN STOCK', color: 'bg-emerald-500' };

    return (
        <Link
            href={`/producto/${id}`}
            className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
                {imagenPrincipal ? (
                    <Image
                        src={imagenPrincipal}
                        alt={nombre}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-200" />
                    </div>
                )}

                {/* Stock Badge */}
                {stockLabel && (
                    <div className={`absolute top-3 right-3 px-2.5 py-1 ${stockLabel.color} text-white text-[10px] font-bold rounded-md tracking-wider shadow-sm`}>
                        {stockLabel.text}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                {/* Brand + OEM */}
                <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        {marcaRepuesto}
                    </span>
                    {codigoOEM && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            {codigoOEM}
                        </span>
                    )}
                </div>

                {/* Name */}
                <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-2 line-clamp-2 min-h-[2.5rem]">
                    {nombre}
                </h3>

                {/* Price */}
                <p className="text-xl font-bold text-slate-900 mb-3">
                    ${precio.toFixed(2)}
                </p>

                {/* Store + Location */}
                <div className="space-y-1 mb-4 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Store className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{tiendaNombre}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{tiendaCiudad}, {tiendaEstado}</span>
                    </div>
                </div>

                {/* CTA (Visual Only) */}
                <div className="block w-full text-center px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl group-hover:bg-blue-700 transition-colors shadow-sm">
                    Ver detalles
                </div>
            </div>
        </Link>
    );
}
