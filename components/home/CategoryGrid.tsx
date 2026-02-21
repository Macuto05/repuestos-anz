import Link from "next/link"
import {
    ArrowRight
} from "lucide-react"

// Custom SVG Icons to match mockup exactly
const MotorIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Three vertical sliders */}
        <path d="M12 20V4" />
        <path d="M12 8h.01" strokeWidth="4" /> {/* Center Knob High */}
        <path d="M6 20V4" />
        <path d="M6 16h.01" strokeWidth="4" /> {/* Left Knob Low */}
        <path d="M18 20V4" />
        <path d="M18 16h.01" strokeWidth="4" /> {/* Right Knob Low */}
    </svg>
)

const BrakesIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

const SuspensionIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Two separate chevrons pointing away */}
        <path d="m8 7 4-4 4 4" /> {/* Up */}
        <path d="m8 17 4 4 4-4" /> {/* Down */}
        <path d="M12 3v0" /> {/* Spacer */}
        <path d="M12 21v0" /> {/* Spacer */}
    </svg>
)

const ElectricIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
)

const TransmissionIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Two separate horizontal arrows */}
        <path d="M4 8h12" /> {/* Top Right */}
        <path d="m13 5 3 3-3 3" />
        <path d="M20 16H8" /> {/* Bottom Left */}
        <path d="m11 13-3 3 3 3" />
    </svg>
)

const OilsIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.6a6.6 6.6 0 0 0-6 8.3L12 22l6-11.1a6.6 6.6 0 0 0-6-8.3Z" />
        <path d="M12 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
    </svg>
)

const BodyIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H12c-.6 0-1.2.2-1.7.5L3 11v5c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
        <path d="M5 11l2-4" />
    </svg>
)

const TiresIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v0" /> {/* Just to differ slightly? Or stick to simple target */}
    </svg>
)


const categories = [
    { name: "Motor", description: "Pistones, empaquetaduras, bujías", icon: MotorIcon },
    { name: "Frenos", description: "Pastillas, discos, líquidos", icon: BrakesIcon },
    { name: "Suspensión", description: "Amortiguadores, resortes, bandejas", icon: SuspensionIcon },
    { name: "Eléctrico", description: "Baterías, alternadores, iluminación", icon: ElectricIcon },
    { name: "Transmisión", description: "Embragues, cajas de cambio, juntas", icon: TransmissionIcon },
    { name: "Aceites", description: "Lubricantes, filtros, aditivos", icon: OilsIcon },
    { name: "Carrocería", description: "Espejos, focos, parachoques", icon: BodyIcon },
    { name: "Neumáticos", description: "Llantas, válvulas, balanceo", icon: TiresIcon },
]

export function CategoryGrid() {
    return (
        <section className="max-w-full mx-auto px-4 sm:px-8 py-20">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Explorar por Categoría</h2>
                    <p className="text-slate-500">Todo lo que necesitas para tu mantenimiento y reparación</p>
                </div>
                <Link href="/categorias" className="text-primary font-semibold flex items-center hover:underline">
                    Ver todas <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {categories.map((cat) => (
                    <Link key={cat.name} href="#" className="group bg-white p-8 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                            <cat.icon className="h-8 w-8" strokeWidth={2} />
                        </div>

                        <h3 className="font-bold text-slate-800">{cat.name}</h3>
                        <p className="text-xs text-slate-500 mt-2">{cat.description}</p>
                    </Link>
                ))}
            </div>
        </section>
    )
}
