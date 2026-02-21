"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronDown } from "lucide-react"
import { getMarcasVehiculo, getModelosByMarca } from "@/lib/actions-productos"

interface MarcaVehiculo {
    id: string;
    nombre: string;
}

interface ModeloVehiculo {
    id: string;
    nombre: string;
}

export function Hero() {
    const router = useRouter();
    const [heroSearch, setHeroSearch] = useState("");

    // Vehicle filter state
    const [marcas, setMarcas] = useState<MarcaVehiculo[]>([]);
    const [modelos, setModelos] = useState<ModeloVehiculo[]>([]);
    const [selectedMarca, setSelectedMarca] = useState("");
    const [selectedModelo, setSelectedModelo] = useState("");
    const [selectedAno, setSelectedAno] = useState("");
    const [loadingModelos, setLoadingModelos] = useState(false);

    // Load brands on mount
    useEffect(() => {
        getMarcasVehiculo().then(setMarcas).catch(console.error);
    }, []);

    // Load models when brand changes
    useEffect(() => {
        if (selectedMarca) {
            setLoadingModelos(true);
            setSelectedModelo("");
            setModelos([]);
            getModelosByMarca(selectedMarca)
                .then(setModelos)
                .catch(console.error)
                .finally(() => setLoadingModelos(false));
        } else {
            setModelos([]);
            setSelectedModelo("");
        }
    }, [selectedMarca]);

    // Generate year options (current year down to 1990)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

    const handleHeroSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (heroSearch.trim()) {
            router.push(`/buscar?q=${encodeURIComponent(heroSearch.trim())}`);
        }
    };

    const handleVehicleFilter = () => {
        const params = new URLSearchParams();
        if (selectedMarca) params.set('marcaVehiculo', selectedMarca);
        if (selectedModelo) params.set('modeloVehiculo', selectedModelo);
        if (selectedAno) params.set('ano', selectedAno);

        if (params.toString()) {
            router.push(`/buscar?${params.toString()}`);
        }
    };

    return (
        <>
            {/* Hero Section */}
            <header className="relative py-20 px-4 overflow-hidden bg-white">
                {/* Abstract Background Element */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-primary opacity-10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
                        Encuentra repuestos para tu <span className="text-primary">vehículo</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-10 max-w-3xl mx-auto tracking-wide">
                        Accede al inventario más grande de piezas originales y alternativas con envío rápido a todo el país.
                    </p>

                    {/* Main Search Bar */}
                    <form onSubmit={handleHeroSearch} className="max-w-3xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            className="block w-full pl-12 pr-4 py-5 bg-white border border-slate-200 rounded-xl shadow-xl focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 placeholder-slate-400 outline-none transition-all"
                            placeholder="Busca por repuesto, código OEM o vehículo..."
                            type="text"
                            value={heroSearch}
                            onChange={(e) => setHeroSearch(e.target.value)}
                        />
                        <button type="submit" className="absolute inset-y-2 right-2 px-6 bg-primary hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                            Buscar
                        </button>
                    </form>
                </div>
            </header>

            {/* Vehicle Selector Section */}
            <section className="max-w-full mx-auto px-4 sm:px-8 -mt-10 relative z-20">
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl border border-slate-100 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Marca */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Marca</label>
                            <div className="relative">
                                <select
                                    value={selectedMarca}
                                    onChange={(e) => setSelectedMarca(e.target.value)}
                                    className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:ring-primary focus:border-primary cursor-pointer appearance-none px-3 pr-10"
                                >
                                    <option value="">Seleccionar Marca</option>
                                    {marcas.map((marca) => (
                                        <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Modelo */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Modelo</label>
                            <div className="relative">
                                <select
                                    value={selectedModelo}
                                    onChange={(e) => setSelectedModelo(e.target.value)}
                                    disabled={!selectedMarca || loadingModelos}
                                    className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:ring-primary focus:border-primary cursor-pointer appearance-none px-3 pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        {loadingModelos ? 'Cargando...' : 'Seleccionar Modelo'}
                                    </option>
                                    {modelos.map((modelo) => (
                                        <option key={modelo.id} value={modelo.id}>{modelo.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Año */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Año</label>
                            <div className="relative">
                                <select
                                    value={selectedAno}
                                    onChange={(e) => setSelectedAno(e.target.value)}
                                    className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:ring-primary focus:border-primary cursor-pointer appearance-none px-3 pr-10"
                                >
                                    <option value="">Seleccionar Año</option>
                                    {years.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Filter Button */}
                        <div className="flex items-end">
                            <button
                                onClick={handleVehicleFilter}
                                disabled={!selectedMarca}
                                className="w-full h-11 bg-primary text-white md:bg-primary/10 md:text-primary md:hover:bg-primary/20 font-bold rounded-lg transition-colors border border-transparent md:border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Filtrar Vehículo
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
