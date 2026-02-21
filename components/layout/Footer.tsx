import Link from "next/link"
import { Facebook, Instagram } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 pt-12 pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
                    {/* Col 1: Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xs">R</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                <span className="text-blue-500">Repuestos</span>
                                <span className="text-white">ANZ</span>
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed">
                            El marketplace líder de autopartes y repuestos para todo tipo de vehículos en Venezuela.
                        </p>
                    </div>

                    {/* Col 2: Compañía */}
                    <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Compañía</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link className="hover:text-white transition-colors" href="#">Sobre nosotros</Link></li>
                            <li><Link className="hover:text-white transition-colors" href="#">Vender repuestos</Link></li>
                            <li><Link className="hover:text-white transition-colors" href="#">Términos y condiciones</Link></li>
                        </ul>
                    </div>

                    {/* Col 3: Soporte */}
                    <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Soporte</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link className="hover:text-white transition-colors" href="#">Centro de ayuda</Link></li>
                            <li><Link className="hover:text-white transition-colors" href="#">Contacto</Link></li>
                            <li><Link className="hover:text-white transition-colors" href="#">Preguntas frecuentes</Link></li>
                        </ul>
                    </div>

                    {/* Col 4: Síguenos */}
                    <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Síguenos</h4>
                        <div className="flex items-center gap-3">
                            <Link
                                href="#"
                                className="w-9 h-9 bg-slate-800 hover:bg-blue-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all"
                            >
                                <Facebook className="w-4 h-4" />
                            </Link>
                            <Link
                                href="#"
                                className="w-9 h-9 bg-slate-800 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all"
                            >
                                <Instagram className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-800 text-center text-xs">
                    <p>© {new Date().getFullYear()} RepuestosANZ Marketplace. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    )
}
