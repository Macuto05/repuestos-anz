'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    X, Package, Tag, DollarSign, BarChart3, Car,
    Pencil, Calendar, CheckCircle, XCircle, ChevronLeft, ChevronRight, Info
} from 'lucide-react';

interface ProductoDetail {
    id: string;
    nombre: string;
    codigoOEM: string | null;
    descripcion: string | null;
    categoriaId: string;
    marcaRepuesto: string;
    precio: number;
    stock: number;
    stockMinimo: number;
    disponible: boolean;
    imagenes: string[];
    imagenPrincipal: string | null;
    createdAt: string;
    updatedAt: string;
    categoria: { nombre: string };
    compatibilidades: {
        id: string;
        marcaNombre: string;
        modeloNombre: string | null;
        anoInicio: number | null;
        anoFin: number | null;
        motor: string | null;
        notas: string | null;
    }[];
}

interface ProductoDetailDrawerProps {
    producto: ProductoDetail | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ProductoDetailDrawer({ producto, isOpen, onClose }: ProductoDetailDrawerProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            setSelectedImage(0);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(onClose, 300);
    };

    if (!isOpen && !isAnimating) return null;
    if (!producto) return null;

    const images = producto.imagenes?.length > 0 ? producto.imagenes : [];
    const hasImages = images.length > 0;

    const nextImage = () => setSelectedImage(prev => (prev + 1) % images.length);
    const prevImage = () => setSelectedImage(prev => (prev - 1 + images.length) % images.length);

    const stockColor = producto.stock <= 0
        ? 'text-red-600 bg-red-50 border-red-200'
        : producto.stock <= 5
            ? 'text-amber-600 bg-amber-50 border-amber-200'
            : 'text-emerald-600 bg-emerald-50 border-emerald-200';

    const stockLabel = producto.stock <= 0
        ? 'Agotado'
        : producto.stock <= 5
            ? 'Bajo Stock'
            : 'En Stock';

    const stockPercent = Math.min(100, (producto.stock / 50) * 100);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            />

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50
                    transform transition-transform duration-300 ease-out
                    ${isAnimating ? 'translate-x-0' : 'translate-x-full'}
                    overflow-y-auto`}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-lg text-slate-900">Detalle del Producto</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-6">

                    {/* Image Gallery */}
                    {hasImages ? (
                        <div className="space-y-3">
                            {/* Main Image */}
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group">
                                <Image
                                    src={images[selectedImage]}
                                    alt={producto.nombre}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />

                                {/* Image Navigation */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-slate-700" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronRight className="w-5 h-5 text-slate-700" />
                                        </button>
                                    </>
                                )}

                                {/* Image Counter */}
                                {images.length > 1 && (
                                    <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                                        {selectedImage + 1} / {images.length}
                                    </div>
                                )}

                                {/* Principal Badge */}
                                {selectedImage === 0 && (
                                    <div className="absolute top-3 left-3 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                                        ★ Principal
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                                                ? 'border-blue-500 ring-2 ring-blue-500/20 scale-105'
                                                : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            <Image src={img} alt="" fill className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <Package className="w-12 h-12 mb-2" />
                            <span className="text-sm font-medium">Sin imágenes</span>
                        </div>
                    )}

                    {/* Product Name + Codigo OEM */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{producto.nombre}</h3>
                        {producto.codigoOEM && (
                            <p className="text-sm text-slate-500 font-mono mt-1 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                OEM: {producto.codigoOEM}
                            </p>
                        )}
                    </div>

                    {/* Price + Stock + Status + Stock Min Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Price */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-xl p-3.5 text-center">
                            <DollarSign className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-blue-700">${producto.precio.toFixed(2)}</p>
                            <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">Precio</p>
                        </div>

                        {/* Stock */}
                        <div className={`border rounded-xl p-3.5 text-center ${stockColor}`}>
                            <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                            <p className="text-lg font-bold">{producto.stock}</p>
                            <p className="text-[10px] font-medium uppercase tracking-wider">{stockLabel}</p>
                        </div>

                        {/* Status */}
                        <div className={`border rounded-xl p-3.5 text-center ${producto.disponible
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                            : 'text-slate-500 bg-slate-50 border-slate-200'}`}
                        >
                            {producto.disponible ? (
                                <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                            ) : (
                                <XCircle className="w-5 h-5 mx-auto mb-1" />
                            )}
                            <p className="text-lg font-bold">{producto.disponible ? 'Activo' : 'Inactivo'}</p>
                            <p className="text-[10px] font-medium uppercase tracking-wider">Estado</p>
                        </div>

                        {/* Stock Mínimo */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                            <BarChart3 className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-700">{producto.stockMinimo || 5}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Stock Mín.</p>
                        </div>
                    </div>



                    {/* Category + Brand */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Categoría</p>
                            <p className="text-sm font-semibold text-slate-800">{producto.categoria.nombre}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Marca Repuesto</p>
                            <p className="text-sm font-semibold text-slate-800">{producto.marcaRepuesto}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {producto.descripcion && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <Info className="w-4 h-4 text-slate-400" />
                                <h4 className="text-sm font-semibold text-slate-700">Descripción</h4>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4">
                                {producto.descripcion}
                            </p>
                        </div>
                    )}

                    {/* Compatibility */}
                    {producto.compatibilidades.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-3">
                                <Car className="w-4 h-4 text-blue-500" />
                                <h4 className="text-sm font-semibold text-slate-700">
                                    Vehículos Compatibles ({producto.compatibilidades.length})
                                </h4>
                            </div>
                            <div className="space-y-2">
                                {producto.compatibilidades.map((comp) => (
                                    <div
                                        key={comp.id}
                                        className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 hover:bg-blue-50/50 hover:border-blue-100 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Car className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                {comp.marcaNombre} {comp.notas || ''}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-2">
                                                {(comp.anoInicio || comp.anoFin) && (
                                                    <span className="flex items-center gap-0.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {comp.anoInicio} - {comp.anoFin}
                                                    </span>
                                                )}
                                                {comp.motor && (
                                                    <span>Motor: {comp.motor}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="border-t border-slate-100 pt-4">
                        <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                            <div>
                                <span className="font-medium">Creado:</span>{' '}
                                {new Date(producto.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div>
                                <span className="font-medium">Modificado:</span>{' '}
                                {new Date(producto.updatedAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* Edit Button */}
                    <Link
                        href={`/productos/${producto.id}/editar`}
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                    >
                        <Pencil className="w-4 h-4" />
                        Editar Producto
                    </Link>
                </div>
            </div>
        </>
    );
}
