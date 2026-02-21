'use client';

import { useActionState } from 'react';
import { authenticate } from '@/lib/actions';
import {
    Building2,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowLeft
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="w-full max-w-[420px]">
            {/* Back to Home */}
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Volver al inicio
            </Link>

            {/* Logo Section */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Building2 className="text-primary h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    RepuestosANZ
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    SaaS para Vendedores de Autopartes
                </p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                <div className="mb-8">
                    <h1 className="text-xl font-semibold text-slate-900">
                        Iniciar sesión
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Ingresa tus credenciales para acceder
                    </p>
                </div>

                <form action={dispatch} className="space-y-5">
                    {/* Email Field */}
                    <div>
                        <label
                            className="block text-sm font-medium text-slate-700 mb-1.5"
                            htmlFor="email"
                        >
                            Correo electrónico
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="text-slate-400 h-5 w-5" />
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200"
                                id="email"
                                name="email"
                                placeholder="vendedor@repuestosanz.com"
                                required
                                type="email"
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label
                                className="block text-sm font-medium text-slate-700"
                                htmlFor="password"
                            >
                                Contraseña
                            </label>
                            <a
                                className="text-xs font-semibold text-primary hover:text-blue-700 transition-colors"
                                href="#"
                            >
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="text-slate-400 h-5 w-5" />
                            </div>
                            <input
                                className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-200"
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                required
                                type={showPassword ? "text" : "password"}
                                suppressHydrationWarning
                            />
                            <div
                                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="text-slate-400 h-5 w-5 hover:text-slate-600 transition-colors" />
                                ) : (
                                    <Eye className="text-slate-400 h-5 w-5 hover:text-slate-600 transition-colors" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div
                            className="flex h-8 items-end space-x-1"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            <p className="text-sm text-red-500">{errorMessage}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={isPending}
                        suppressHydrationWarning
                    >
                        {isPending ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* Terms Footer */}
                <div className="mt-12 flex justify-center space-x-4 text-xs text-slate-400">
                    <a className="hover:text-primary transition-colors" href="#">
                        Privacidad
                    </a>
                    <a className="hover:text-primary transition-colors" href="#">
                        Términos
                    </a>
                    <a className="hover:text-primary transition-colors" href="#">
                        Ayuda
                    </a>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="fixed top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none"></div>
        </div>
    );
}
