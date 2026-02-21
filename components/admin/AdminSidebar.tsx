'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    Package,
    Tags,
    Car,
    Users,
    UserRoundCog,
    Settings,
    LogOut,
    SlidersHorizontal
} from 'lucide-react';
import { logout } from '@/lib/actions';

const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Tiendas', href: '/admin/tiendas', icon: Store },
    { name: 'Productos', href: '/admin/productos', icon: Package },
    { name: 'Categorías', href: '/admin/categorias', icon: Tags },
    { name: 'Vehículos', href: '/admin/vehiculos', icon: Car },
    { name: 'Vendedores', href: '/admin/vendedores', icon: UserRoundCog },
    { name: 'Administradores', href: '/admin/usuarios', icon: Users },
    { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

interface AdminSidebarProps {
    user?: { name: string | null };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col z-30">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <SlidersHorizontal className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 text-lg leading-none">RepuestosANZ</h1>
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full inline-block mt-1">
                            ADMIN
                        </span>
                    </div>
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
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-200">
                <div className="flex items-center gap-3 p-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                            {user?.name || 'Usuario'}
                        </p>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
