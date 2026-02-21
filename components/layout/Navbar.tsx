"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShoppingCart, User, Menu, X, Search } from "lucide-react"
import { useState } from "react"

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const isHomePage = pathname === "/";
    const isSearchPage = pathname?.startsWith("/buscar");
    const isProductPage = pathname?.startsWith("/producto");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">R</span>
                            </div>
                            <span className="text-xl font-extrabold tracking-tight">
                                <span className="text-blue-600">Repuestos</span>
                                <span className="text-slate-900">ANZ</span>
                            </span>
                        </Link>
                    </div>

                    {/* Search Bar (Only on non-home pages) */}
                    {!isHomePage && (
                        <div className="hidden md:block flex-1 max-w-2xl mx-8">
                            <form onSubmit={handleSearch} className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-600 focus:outline-none focus:bg-white focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                    placeholder="Buscar repuestos, filtros, bujías..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </form>
                        </div>
                    )}

                    {/* Right Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        {isHomePage ? (
                            <>
                                <Link
                                    href="/login"
                                    className="text-slate-600 hover:text-slate-900 font-medium px-3 py-2 transition-colors"
                                >
                                    Ingresar
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-blue-600 text-white hover:bg-blue-700 font-medium px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow"
                                >
                                    Registrarse
                                </Link>
                            </>
                        ) : !isSearchPage && !isProductPage ? (
                            <>
                                <Link
                                    href="#"
                                    className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                    title="Carrito"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    <User className="w-4.5 h-4.5" />
                                    Mi Cuenta
                                </Link>
                            </>
                        ) : null}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-slate-600 hover:text-slate-900 p-2"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden pb-4 pt-2 border-t border-slate-100">
                        {!isHomePage && (
                            <div className="mb-4 px-2">
                                <form onSubmit={handleSearch} className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-600 focus:outline-none focus:bg-white focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </form>
                            </div>
                        )}
                        <div className="flex flex-col gap-1 px-2">
                            {isHomePage ? (
                                <>
                                    <Link
                                        href="/login"
                                        className="block px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                                    >
                                        Ingresar
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        Registrarse
                                    </Link>
                                </>
                            ) : !isSearchPage && !isProductPage ? (
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                                >
                                    <User className="w-4 h-4" />
                                    Mi Cuenta
                                </Link>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
