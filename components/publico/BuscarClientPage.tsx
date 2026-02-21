'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { Filter, ChevronLeft, ChevronRight, X, SlidersHorizontal } from 'lucide-react';

interface ProductoResultado {
    id: string;
    nombre: string;
    codigoOEM: string | null;
    descripcion: string | null;
    marcaRepuesto: string;
    precio: number;
    stock: number;
    disponible: boolean;
    imagenPrincipal: string | null;
    tiendaNombre: string;
    tiendaCiudad: string;
    tiendaEstado: string;
    categoriaNombre: string;
}

interface FiltrosDisponibles {
    categorias: { id: string; nombre: string; count: number }[];
    marcas: { nombre: string; count: number }[];
    tiendas: { id: string; nombre: string; count: number }[];
    precioMin: number;
    precioMax: number;
}

interface BuscarClientPageProps {
    productos: ProductoResultado[];
    total: number;
    totalPages: number;
    currentPage: number;
    query: string;
    filtrosDisponibles: FiltrosDisponibles;
    filtrosActivos: {
        categorias: string[];
        marcas: string[];
        tiendas?: string[];
        precioMin?: number;
        precioMax?: number;
        soloStock: boolean;
        orden: string;
    };
    implicitFilters?: {
        categorias: string[];
        marcas: string[];
    };
}

export function BuscarClientPage({
    productos,
    total,
    totalPages,
    currentPage,
    query,
    filtrosDisponibles,
    filtrosActivos,
    implicitFilters,
}: BuscarClientPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Accordion Component
    const FilterAccordion = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
        const [isOpen, setIsOpen] = useState(defaultOpen);
        return (
            <div className="border-b border-slate-100 last:border-0 py-4">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full group"
                >
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">{title}</span>
                    {isOpen ? <ChevronLeft className="w-4 h-4 text-slate-400 rotate-90 transition-transform" /> : <ChevronRight className="w-4 h-4 text-slate-400 transition-transform" />}
                </button>
                {isOpen && (
                    <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    // Local state for deferred filtering
    const [localFilters, setLocalFilters] = useState(filtrosActivos);

    // Sync local state when URL params change (e.g. navigation, implicit filters)
    useEffect(() => {
        setLocalFilters(filtrosActivos);
    }, [filtrosActivos]);

    // Handle Implicit Filters (Redirect to parameterized URL)
    useEffect(() => {
        if (implicitFilters) {
            const hasImplicitCats = implicitFilters.categorias && implicitFilters.categorias.length > 0;
            const hasImplicitBrands = implicitFilters.marcas && implicitFilters.marcas.length > 0;

            if (hasImplicitCats || hasImplicitBrands) {
                const params = new URLSearchParams(searchParams.toString());
                const currentQ = params.get('q');

                // Only redirect if we still have the query param that triggered this
                if (currentQ) {
                    params.delete('q'); // Clear text search

                    if (hasImplicitCats) {
                        const current = params.getAll('categoria');
                        implicitFilters.categorias.forEach(c => {
                            if (!current.includes(c)) params.append('categoria', c);
                        });
                    }

                    if (hasImplicitBrands) {
                        const current = params.getAll('marca');
                        implicitFilters.marcas.forEach(m => {
                            if (!current.includes(m)) params.append('marca', m);
                        });
                    }

                    router.replace(`/buscar?${params.toString()}`);
                }
            }
        }
    }, [implicitFilters, router, searchParams]);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // Build URL with updated params
    const updateParams = useCallback((updates: Record<string, string | string[] | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());

        // Reset to page 1 when filters change
        if (!('pagina' in updates)) {
            params.delete('pagina');
        }

        Object.entries(updates).forEach(([key, value]) => {
            params.delete(key);
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach(v => params.append(key, v));
                } else {
                    params.set(key, value);
                }
            }
        });

        router.push(`/buscar?${params.toString()}`);
    }, [router, searchParams]);

    const toggleCategoria = (id: string) => {
        setLocalFilters(prev => {
            const current = prev.categorias;
            const next = current.includes(id) ? current.filter(c => c !== id) : [...current, id];
            return { ...prev, categorias: next };
        });
    };

    const toggleMarca = (nombre: string) => {
        setLocalFilters(prev => {
            const current = prev.marcas;
            const next = current.includes(nombre) ? current.filter(m => m !== nombre) : [...current, nombre];
            return { ...prev, marcas: next };
        });
    };

    const toggleTienda = (id: string) => {
        setLocalFilters(prev => {
            const current = prev.tiendas || [];
            const next = current.includes(id) ? current.filter(t => t !== id) : [...current, id];
            return { ...prev, tiendas: next };
        });
    };

    const clearFilters = () => {
        router.push(`/buscar?q=${encodeURIComponent(query)}`);
    };

    const hasActiveFilters = filtrosActivos.categorias.length > 0 ||
        filtrosActivos.marcas.length > 0 ||
        (filtrosActivos.tiendas && filtrosActivos.tiendas.length > 0) ||
        filtrosActivos.precioMin !== undefined ||
        filtrosActivos.precioMax !== undefined ||
        filtrosActivos.soloStock;

    const hasPendingChanges = JSON.stringify(localFilters) !== JSON.stringify(filtrosActivos);

    // Filter Application
    const applyFilters = () => {
        updateParams({
            categoria: localFilters.categorias,
            marca: localFilters.marcas,
            tiendas: localFilters.tiendas,
            precioMin: localFilters.precioMin !== undefined ? String(localFilters.precioMin) : undefined,
            precioMax: localFilters.precioMax !== undefined ? String(localFilters.precioMax) : undefined,
            stock: localFilters.soloStock ? 'true' : undefined
        });
    };

    // Filter sidebar content (shared between desktop and mobile)
    const FilterContent = () => (
        <div className="space-y-6 relative min-h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Filtros</h3>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        Limpiar todo
                    </button>
                )}
            </div>

            {/* Categorías */}
            {filtrosDisponibles.categorias.length > 0 && (
                <FilterAccordion title="Categorías" defaultOpen={true}>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {filtrosDisponibles.categorias.map((cat) => (
                            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={localFilters.categorias.includes(cat.id)}
                                    onChange={() => toggleCategoria(cat.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                                />
                                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors flex-1">
                                    {cat.nombre}
                                </span>
                                <span className="text-xs text-slate-400">({cat.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterAccordion>
            )}

            {/* Rango de Precio */}
            <FilterAccordion title="Rango de Precio" defaultOpen={true}>
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">$</span>
                            <input
                                type="number"
                                value={localFilters.precioMin ?? filtrosDisponibles.precioMin}
                                onChange={(e) => setLocalFilters(prev => ({ ...prev, precioMin: Number(e.target.value) }))}
                                min={0}
                                className="w-full pl-6 pr-2 py-2 text-sm font-medium text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                placeholder="Min"
                            />
                        </div>
                        <span className="text-slate-400 text-xs">—</span>
                        <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">$</span>
                            <input
                                type="number"
                                value={localFilters.precioMax ?? filtrosDisponibles.precioMax}
                                onChange={(e) => setLocalFilters(prev => ({ ...prev, precioMax: Number(e.target.value) }))}
                                min={0}
                                className="w-full pl-6 pr-2 py-2 text-sm font-medium text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                                placeholder="Max"
                            />
                        </div>
                    </div>
                    <input
                        type="range"
                        min={filtrosDisponibles.precioMin}
                        max={filtrosDisponibles.precioMax}
                        value={localFilters.precioMax ?? filtrosDisponibles.precioMax}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, precioMax: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                        style={{
                            background: `linear-gradient(to right, #2563eb ${(((localFilters.precioMax ?? filtrosDisponibles.precioMax) - filtrosDisponibles.precioMin) / (filtrosDisponibles.precioMax - filtrosDisponibles.precioMin)) * 100}%, #e2e8f0 ${(((localFilters.precioMax ?? filtrosDisponibles.precioMax) - filtrosDisponibles.precioMin) / (filtrosDisponibles.precioMax - filtrosDisponibles.precioMin)) * 100}%)`
                        }}
                    />
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>${filtrosDisponibles.precioMin.toFixed(0)}</span>
                        <span>${filtrosDisponibles.precioMax.toFixed(0)}</span>
                    </div>
                </div>
            </FilterAccordion>

            {/* Marcas */}
            {
                filtrosDisponibles.marcas.length > 0 && (
                    <FilterAccordion title="Marcas">
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {filtrosDisponibles.marcas.map((marca) => (
                                <label key={marca.nombre} className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={localFilters.marcas.includes(marca.nombre)}
                                        onChange={() => toggleMarca(marca.nombre)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                                    />
                                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors flex-1">
                                        {marca.nombre}
                                    </span>
                                    <span className="text-xs text-slate-400">({marca.count})</span>
                                </label>
                            ))}
                        </div>
                    </FilterAccordion>
                )
            }

            {/* Tiendas */}
            {filtrosDisponibles.tiendas?.length > 0 && (
                <FilterAccordion title="Tiendas">
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {filtrosDisponibles.tiendas.map((tienda) => (
                            <label key={tienda.id} className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={localFilters.tiendas?.includes(tienda.id)}
                                    onChange={() => toggleTienda(tienda.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                                />
                                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors flex-1">
                                    {tienda.nombre}
                                </span>
                                <span className="text-xs text-slate-400">({tienda.count})</span>
                            </label>
                        ))}
                    </div>
                </FilterAccordion>
            )}

            {/* Solo en stock */}
            <div>
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-slate-700">Solo en stock</span>
                    <button
                        onClick={() => setLocalFilters(prev => ({ ...prev, soloStock: !prev.soloStock }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localFilters.soloStock ? 'bg-blue-600' : 'bg-slate-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${localFilters.soloStock ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </label>
            </div>

            {/* Apply Button */}
            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-100 mt-auto">
                <button
                    onClick={applyFilters}
                    disabled={!hasPendingChanges}
                    className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                    Aplicar Filtros
                </button>
            </div>
        </div>
    );

    // Pagination
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        {total.toLocaleString()} resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
                    </h1>
                    {query && (
                        <p className="text-sm text-slate-500 mt-0.5">
                            Mostrando productos en &ldquo;{query}&rdquo;
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Mobile filter button */}
                    <button
                        onClick={() => setMobileFiltersOpen(true)}
                        className="lg:hidden flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filtros
                    </button>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 hidden sm:inline">Ordenar por:</span>
                        <select
                            value={filtrosActivos.orden}
                            onChange={(e) => updateParams({ orden: e.target.value })}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer"
                        >
                            <option value="relevancia">Relevancia</option>
                            <option value="precio_asc">Menor precio</option>
                            <option value="precio_desc">Mayor precio</option>
                            <option value="recientes">Más recientes</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex gap-6">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-5 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                        <FilterContent />
                    </div>
                </aside>

                {/* Mobile Filter Drawer */}
                {mobileFiltersOpen && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                            onClick={() => setMobileFiltersOpen(false)}
                        />
                        <div className="fixed left-0 top-0 h-full w-80 bg-white z-50 lg:hidden overflow-y-auto shadow-2xl">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-blue-600" />
                                    <span className="font-bold text-slate-900">Filtros</span>
                                </div>
                                <button
                                    onClick={() => setMobileFiltersOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5">
                                <FilterContent />
                            </div>
                        </div>
                    </>
                )}

                {/* Product Grid */}
                <div className="flex-1">
                    {productos.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {productos.map((producto) => (
                                    <ProductCard
                                        key={producto.id}
                                        id={producto.id}
                                        nombre={producto.nombre}
                                        codigoOEM={producto.codigoOEM}
                                        marcaRepuesto={producto.marcaRepuesto}
                                        precio={producto.precio}
                                        stock={producto.stock}
                                        imagenPrincipal={producto.imagenPrincipal}
                                        tiendaNombre={producto.tiendaNombre}
                                        tiendaCiudad={producto.tiendaCiudad}
                                        tiendaEstado={producto.tiendaEstado}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-1.5 mt-10">
                                    <button
                                        onClick={() => updateParams({ pagina: String(currentPage - 1) })}
                                        disabled={currentPage <= 1}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {getPageNumbers().map((page, idx) =>
                                        typeof page === 'string' ? (
                                            <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-sm text-slate-400">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => updateParams({ pagina: String(page) })}
                                                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === currentPage
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}

                                    <button
                                        onClick={() => updateParams({ pagina: String(currentPage + 1) })}
                                        disabled={currentPage >= totalPages}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Filter className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">No se encontraron resultados</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto">
                                {query
                                    ? `No hay productos que coincidan con "${query}". Intenta con otros términos o ajusta los filtros.`
                                    : 'Usa el buscador o los filtros para encontrar repuestos.'}
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
