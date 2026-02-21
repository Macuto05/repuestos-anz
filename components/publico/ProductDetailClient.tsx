"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, MessageCircle, ShieldCheck, Map, Clock, CreditCard, Building2, Package, CheckCircle2, Store } from "lucide-react"
import { RelatedProductCard } from "./RelatedProductCard"

interface RelatedProduct {
    id: string;
    nombre: string;
    marcaRepuesto: string;
    precio: number;
    stock: number;
    imagenPrincipal: string | null;
    tiendaNombre: string;
    tiendaCiudad: string;
    tiendaEstado: string;
}

interface ProductDetailProps {
    producto: {
        id: string;
        nombre: string;
        codigoOEM: string | null;
        descripcion: string | null;
        marcaRepuesto: string;
        precio: any; // Number
        stock: number;
        imagenes: string[];
        imagenPrincipal: string | null;
        disponible: boolean;
        categoria: { nombre: string };
        tienda: {
            nombre: string;
            ciudad: string;
            estado: string;
            direccion: string;
            telefono: string;
            whatsapp: string | null;
            googleMapsUrl: string | null;
            horario: any;
        };
        compatibilidades: Array<{
            marca: { nombre: string };
            modelo: { nombre: string } | null;
            anoInicio: number | null;
            anoFin: number | null;
            motor: string | null;
            notas: string | null;
        }>;
    };
    relatedProducts: RelatedProduct[];
}

export function ProductDetailClient({ producto, relatedProducts }: ProductDetailProps) {
    const [selectedImage, setSelectedImage] = useState(producto.imagenPrincipal || producto.imagenes[0] || "/placeholder-product.jpg");

    // Format price
    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(producto.precio));

    // Mock old price for demo visual (e.g. 15% more) - Remove if real data exists
    const oldPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(producto.precio) * 1.15);

    const whatsappLink = producto.tienda.whatsapp
        ? `https://wa.me/${producto.tienda.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, estou interesado en el repuesto: ${producto.nombre} (Código OEM: ${producto.codigoOEM || 'N/A'})`)}`
        : "#";

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Breadcrumb */}
                <div className="text-sm text-slate-500 mb-6 flex items-center gap-2">
                    <Link href="/buscar" className="hover:text-blue-600 transition-colors">Repuestos</Link>
                    <span className="text-slate-300">›</span>
                    <span className="hover:text-blue-600 transition-colors cursor-pointer">{producto.categoria.nombre}</span>
                    <span className="text-slate-300">›</span>
                    <span className="text-slate-900 font-medium truncate">{producto.nombre}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Images */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-slate-100 h-[300px] sm:h-[400px] lg:h-[500px] w-full relative overflow-hidden flex items-center justify-center">
                            {producto.imagenes.length > 0 ? (
                                <Image
                                    src={selectedImage}
                                    alt={producto.nombre}
                                    fill
                                    className="object-contain p-4"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    priority
                                />
                            ) : (
                                <div className="text-slate-300 flex flex-col items-center">
                                    <ShieldCheck className="w-16 h-16 mb-2" />
                                    <span>Sin imagen</span>
                                </div>
                            )}
                        </div>
                        {/* Thumbnails */}
                        {producto.imagenes.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {producto.imagenes.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(img)}
                                        className={`flex-shrink-0 w-24 h-24 bg-white rounded-xl border-2 overflow-hidden ${selectedImage === img ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-100 hover:border-slate-300'} transition-all p-2`}
                                    >
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={img}
                                                alt={`Vista ${idx + 1}`}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Desktop Description & Compatibility (Hidden on mobile) */}
                        <div className="hidden lg:block space-y-6">
                            <DescriptionContent producto={producto} />
                        </div>

                    </div>

                    {/* Right Column: Info */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Product Info Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative">
                            <div className="flex justify-between items-start mb-2">
                                <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                    Repuesto Original
                                </span>
                                {producto.codigoOEM && (
                                    <span className="text-xs text-slate-400 font-mono mt-0.5">Código OEM: {producto.codigoOEM}</span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-1">
                                {producto.nombre}
                            </h1>
                            <p className="text-slate-500 font-medium mb-4 text-sm">Marca: <span className="text-slate-900 font-bold">{producto.marcaRepuesto}</span></p>

                            <div className="items-baseline mb-4">
                                <span className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">{formattedPrice}</span>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-bold ${producto.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    <div className={`w-2 h-2 rounded-full mr-2 ${producto.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {producto.stock > 0 ? 'Disponible' : 'Agotado'}
                                </span>
                                <span className="text-sm text-slate-400 font-medium">Stock: {producto.stock} unidades</span>
                            </div>

                            <Link
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-200 hover:shadow-green-300 transform hover:-translate-y-0.5"
                            >
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Contactar por WhatsApp
                            </Link>
                        </div>

                        {/* Shop Info Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Store className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{producto.tienda.nombre}</h3>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VENDEDOR VERIFICADO</span>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-slate-600 mb-6 pl-1">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                                    <span className="leading-relaxed">{producto.tienda.direccion}, {producto.tienda.ciudad}</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                                    <div className="flex flex-col gap-1">
                                        {(() => {
                                            if (!producto.tienda.horario) {
                                                return <span className='italic text-slate-400'>Horario no registrado</span>;
                                            }

                                            try {
                                                const horario = producto.tienda.horario as any;
                                                const daysOrder = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

                                                return daysOrder.map(dayKey => {
                                                    const schedule = horario[dayKey];
                                                    const dayLabel = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);

                                                    // Highlight today
                                                    const daysMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
                                                    const now = new Date();
                                                    const isToday = daysMap[now.getDay()] === dayKey;

                                                    return (
                                                        <div key={dayKey} className={`text-sm flex justify-between items-center ${isToday ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                            <span className="w-24">{dayLabel}:</span>
                                                            <span className={!schedule?.abierto ? 'text-slate-400 italic' : ''}>
                                                                {!schedule || !schedule.abierto
                                                                    ? 'Cerrado'
                                                                    : `${schedule.horaApertura} - ${schedule.horaCierre}`
                                                                }
                                                            </span>
                                                        </div>
                                                    );
                                                });
                                            } catch (e) {
                                                return <span>Horario no disponible</span>;
                                            }
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Map Preview */}
                            <div className="w-full h-64 rounded-xl overflow-hidden mb-6 border border-slate-200 shadow-sm">
                                {producto.tienda.googleMapsUrl ? (
                                    <iframe
                                        src={producto.tienda.googleMapsUrl}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen={true}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center bg-[#e5e3df]">
                                        <div className="flex flex-col items-center gap-1">
                                            <MapPin className="w-6 h-6 text-slate-400" />
                                            <span>Ubicación no disponible</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button disabled className="w-full py-3 text-slate-400 font-bold border border-slate-100 rounded-xl bg-slate-50 cursor-not-allowed flex items-center justify-center gap-2">
                                Visitar la tienda
                            </button>
                        </div>
                    </div>

                    {/* Mobile Description & Compatibility (Visible only on mobile) */}
                    <div className="lg:hidden mt-8 space-y-6">
                        <DescriptionContent producto={producto} />
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16 pt-8 border-t border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">Productos relacionados</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedProducts.map((p) => (
                                <RelatedProductCard
                                    key={p.id}
                                    id={p.id}
                                    nombre={p.nombre}
                                    marcaRepuesto={p.marcaRepuesto}
                                    precio={p.precio}
                                    imagenPrincipal={p.imagenPrincipal}
                                    stock={p.stock}
                                    tiendaNombre={p.tiendaNombre}
                                    tiendaCiudad={p.tiendaCiudad}
                                    tiendaEstado={p.tiendaEstado}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function DescriptionContent({ producto }: { producto: any }) {
    return (
        <>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Descripción del Producto</h2>
                <div className="prose prose-slate max-w-none text-slate-600 prose-sm">
                    {producto.descripcion ? (
                        <p className="whitespace-pre-line leading-relaxed">{producto.descripcion}</p>
                    ) : (
                        <p className="italic text-slate-400">Sin descripción disponible.</p>
                    )}
                </div>
            </div>

            {/* Compatibility Table */}
            {producto.compatibilidades.length > 0 && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Compatibilidad con vehículos</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-2 rounded-l-lg">Marca</th>
                                    <th className="px-4 py-2">Modelo</th>
                                    <th className="px-4 py-2">Años</th>
                                    <th className="px-4 py-2">Motor</th>
                                    <th className="px-4 py-2 rounded-r-lg">Notas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {producto.compatibilidades.map((c: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900">{c.marca.nombre}</td>
                                        <td className="px-4 py-3">{c.modelo?.nombre || '-'}</td>
                                        <td className="px-4 py-3">
                                            {c.anoInicio ? `${c.anoInicio} - ${c.anoFin || 'Presente'}` : '-'}
                                        </td>
                                        <td className="px-4 py-3">{c.motor || '-'}</td>
                                        <td className="px-4 py-3 italic text-slate-500">{c.notas || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
