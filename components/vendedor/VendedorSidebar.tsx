'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Store,
    LogOut,
    ClipboardList, // Changed from SlidersHorizontal
    Truck,
    PackageSearch,
    FileText,
    ShoppingCart,
} from 'lucide-react';
import { logout } from '@/lib/actions';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mis Productos', href: '/productos', icon: Package },
    { name: 'Proveedores', href: '/proveedores', icon: Truck },
    { name: 'Pedidos', href: '/ordenes', icon: PackageSearch },
    { name: 'Kardex', href: '/kardex', icon: FileText }, // Reusing FileText or change to History if imported
    { name: 'Mi Tienda', href: '/tienda', icon: Store },
    { name: 'Ajustes', href: '/ajustes', icon: ClipboardList },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart }, // Changed icon later in import
];

interface VendedorSidebarProps {
    user?: { name: string | null };
}

export function VendedorSidebar({ user }: VendedorSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col z-30">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <ClipboardList className="text-white w-5 h-5" />
                    </div>
                    <h1 className="font-bold text-slate-900 text-lg leading-none">RepuestosANZ</h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            suppressHydrationWarning
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Cerrar sesión */}
            <div className="p-4 border-t border-slate-200">
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    suppressHydrationWarning
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
