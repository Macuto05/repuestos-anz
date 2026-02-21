'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import {
    Plus, Search, Filter, Eye, Pencil,
    Package, CheckCircle, AlertTriangle, X
} from 'lucide-react';
import { toggleProductoDisponible, getProductoById } from '@/lib/actions-productos';
import Image from 'next/image';
import { ProductoDetailDrawer } from './ProductoDetailDrawer';
import { Pagination } from '@/components/ui/Pagination';

interface Producto {
    id: string;
    nombre: string;
    sku: string | null; // Deprecated, kept for compatibility if needed
    codigoOEM: string | null;
    imagenPrincipal: string | null;
    categoria: { nombre: string };
    precio: number;
    stock: number;
    stockMinimo: number;
    disponible: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Categoria {
    id: string;
    nombre: string;
}

interface Stats {
    total: number;
    inStock: number;
    lowStock: number;
}

interface MisProductosClientPageProps {
    initialProductos: any[]; // Using any to bypass detailed type mapping for now
    total: number;
    totalPages: number;
    itemsPerPage: number;
    stats: Stats;
    categorias: Categoria[];
}

export function MisProductosClientPage({
    initialProductos,
    total,
    totalPages,
    itemsPerPage,
    stats,
    categorias,
}: MisProductosClientPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Filters state
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [debouncedSearch] = useDebounce(search, 500);
    const [categoriaId, setCategoriaId] = useState(searchParams.get('categoria') || '');
    const [estado, setEstado] = useState(searchParams.get('estado') || '');
    const currentPage = parseInt(searchParams.get('page') || '1');

    const [isPending, startTransition] = useTransition();

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearch) {
            params.set('search', debouncedSearch);
        } else {
            params.delete('search');
        }
        if (categoriaId) {
            params.set('categoria', categoriaId);
        } else {
            params.delete('categoria');
        }
        if (estado) {
            params.set('estado', estado);
        } else {
            params.delete('estado');
        }

        // Reset to page 1 on filter change
        params.set('page', '1');

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }, [debouncedSearch, categoriaId, estado]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pagination handler
    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    // Toggle handler
    const handleToggle = async (id: string, current: boolean) => {
        await toggleProductoDisponible(id, !current);
        router.refresh();
    };

    // View drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerProduct, setDrawerProduct] = useState<any>(null);
    const [loadingDrawer, setLoadingDrawer] = useState(false);

    const handleView = async (id: string) => {
        setLoadingDrawer(true);
        setDrawerOpen(true);
        const data = await getProductoById(id);
        setDrawerProduct(data);
        setLoadingDrawer(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Mis Productos</h1>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none sm:w-[450px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por producto, OEM o marca..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                            suppressHydrationWarning
                        />
                    </div>
                    <Link href="/productos/crear" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 font-medium text-sm whitespace-nowrap">
                        <Plus className="w-4 h-4" />
                        Agregar Producto
                    </Link>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Filtrar por:</span>

                    <select
                        value={categoriaId}
                        onChange={(e) => setCategoriaId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none min-w-[160px]"
                        suppressHydrationWarning
                    >
                        <option value="">Todas las Categorías</option>
                        {categorias.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 outline-none min-w-[140px]"
                        suppressHydrationWarning
                    >
                        <option value="">Estado: Todos</option>
                        <option value="true">Activos</option>
                        <option value="false">Inactivos</option>
                    </select>

                    {(categoriaId || estado || search) && (
                        <button
                            onClick={() => {
                                setCategoriaId('');
                                setEstado('');
                                setSearch('');
                                const params = new URLSearchParams();
                                params.set('page', '1');
                                router.replace(`${pathname}?${params.toString()}`);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-blue-100"
                        >
                            <X className="w-4 h-4" />
                            Limpiar
                        </button>
                    )}
                </div>

                <div className="text-sm font-medium text-slate-400">
                    Mostrando <span className="text-slate-900">{initialProductos.length}</span> de <span className="text-slate-900">{total}</span> productos
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Foto</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre / Código OEM</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Precio</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Disponible</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {initialProductos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No se encontraron productos.
                                    </td>
                                </tr>
                            ) : (
                                initialProductos.map((producto) => (
                                    <tr key={producto.id} className="hover:bg-slate-50/50 transition-colors group">
                                        {/* Foto */}
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200">
                                                {producto.imagenPrincipal ? (
                                                    <Image
                                                        src={producto.imagenPrincipal}
                                                        alt={producto.nombre}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Package className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Nombre / SKU */}
                                        <td className="px-6 py-4 min-w-[250px]">
                                            <div className="font-semibold text-slate-900">{producto.nombre}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                {producto.codigoOEM || 'Sin Código OEM'}
                                            </div>
                                        </td>

                                        {/* Categoría */}
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                {producto.categoria?.nombre || 'Sin categoría'}
                                            </span>
                                        </td>

                                        {/* Precio */}
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            ${producto.precio.toFixed(2)}
                                        </td>

                                        {/* Stock */}
                                        <td className="px-6 py-4">
                                            <span className={`font-medium ${producto.stock <= (producto.stockMinimo || 5) ? 'text-red-600' : 'text-slate-700'}`}>
                                                {producto.stock}
                                            </span>
                                        </td>

                                        {/* Disponible Toggle */}
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                suppressHydrationWarning
                                                onClick={() => handleToggle(producto.id, producto.disponible)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${producto.disponible ? 'bg-blue-600' : 'bg-slate-200'
                                                    }`}
                                            >
                                                <span
                                                    className={`${producto.disponible ? 'translate-x-6' : 'translate-x-1'
                                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                />
                                            </button>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    suppressHydrationWarning
                                                    onClick={() => handleView(producto.id)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    href={`/productos/${producto.id}/editar`}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="text-sm text-slate-500 font-medium">
                        Mostrando registros del <span className="font-bold text-slate-900">{initialProductos.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> al <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, total)}</span>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>



            {/* Product Detail Drawer */}
            <ProductoDetailDrawer
                producto={drawerProduct}
                isOpen={drawerOpen}
                onClose={() => { setDrawerOpen(false); setDrawerProduct(null); }}
            />
        </div >
    );
}
