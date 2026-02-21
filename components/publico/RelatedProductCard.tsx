import Link from 'next/link';
import Image from 'next/image';

interface RelatedProductCardProps {
    id: string;
    nombre: string;
    marcaRepuesto: string;
    precio: number;
    stock: number;
    imagenPrincipal: string | null;
    tiendaNombre?: string;
    tiendaCiudad?: string;
    tiendaEstado?: string;
}

export function RelatedProductCard({ id, nombre, precio, imagenPrincipal }: RelatedProductCardProps) {
    return (
        <Link href={`/producto/${id}`} className="group block">
            <div className="bg-slate-100 rounded-2xl aspect-square overflow-hidden mb-4 relative">
                {imagenPrincipal ? (
                    <Image
                        src={imagenPrincipal}
                        alt={nombre}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        No Image
                    </div>
                )}
            </div>
            <h3 className="font-medium text-slate-900 leading-snug mb-1 group-hover:text-blue-600 transition-colors">
                {nombre}
            </h3>
            <p className="text-lg font-bold text-blue-600">
                ${new Intl.NumberFormat('en-US').format(precio)}
            </p>
        </Link>
    );
}
