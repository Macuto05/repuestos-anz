"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, UserPlus, Trash2, Plus, Minus, FileText, Check, X, CreditCard, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { crearVenta, buscarClientes, obtenerOCrearPerfilCliente, buscarProductosPOS } from "@/lib/actions-ventas";
import { MetodoPago } from "@prisma/client";
import { useSession } from "next-auth/react";
import Image from "next/image";

// Tipos para el carrito
type ProductoCarrito = {
    id: string;
    nombre: string;
    codigoOEM?: string;
    precio: number;
    stock: number;
    cantidad: number;
    imagen?: string;
};

// Eliminado type MetodoPago local para usar el importado de Prisma

type PagoMixto = {
    id: string; // for React key
    metodoPago: MetodoPago;
    montoUSD: number;
    montoBs?: number; // Calculated or entered
    referencia?: string;
};

export default function POSClientPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [query, setQuery] = useState("");
    const [productos, setProductos] = useState<any[]>([]);
    const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
    const [clienteQuery, setClienteQuery] = useState("");
    const [clientesEncontrados, setClientesEncontrados] = useState<any[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);
    const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO_BS");
    const [tasaDolar, setTasaDolar] = useState<number | "">("");
    const [pagosMixtos, setPagosMixtos] = useState<PagoMixto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showClienteForm, setShowClienteForm] = useState(false);

    // Estados para nuevo cliente
    const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", cedula: "", telefono: "", email: "" });

    // Búsqueda de Productos (Debounce manual simple)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length > 2) {
                setIsSearching(true);
                const resultados = await buscarProductosPOS(query);
                setProductos(resultados);
                setIsSearching(false);
            } else {
                setProductos([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Búsqueda de Clientes
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (clienteQuery.length > 2 && !clienteSeleccionado) {
                const resultados = await buscarClientes(clienteQuery);
                setClientesEncontrados(resultados || []);
            } else {
                setClientesEncontrados([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [clienteQuery, clienteSeleccionado]);

    const agregarAlCarrito = (producto: any) => {
        setCarrito((prev) => {
            const existente = prev.find((p) => p.id === producto.id);
            if (existente) {
                if (existente.cantidad + 1 > producto.stock) {
                    toast.error("No hay suficiente stock");
                    return prev;
                }
                return prev.map((p) =>
                    p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
                );
            }
            return [...prev, {
                id: producto.id,
                nombre: producto.nombre,
                codigoOEM: producto.codigoOEM,
                precio: Number(producto.precio),
                stock: producto.stock,
                cantidad: 1,
                imagen: producto.imagenPrincipal
            }];
        });
        setQuery("");
        setProductos([]);
        toast.success("Producto agregado");
    };

    const actualizarCantidad = (id: string, delta: number) => {
        setCarrito((prev) => prev.map((item) => {
            if (item.id === id) {
                const nuevaCantidad = item.cantidad + delta;
                if (nuevaCantidad > item.stock) {
                    toast.error("Stock insuficiente");
                    return item;
                }
                return { ...item, cantidad: Math.max(1, nuevaCantidad) };
            }
            return item;
        }));
    };

    const eliminarDelCarrito = (id: string) => {
        setCarrito((prev) => prev.filter((item) => item.id !== id));
    };

    const totalVenta = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);

    const procesarVenta = async () => {
        if (carrito.length === 0) return;

        // Validaciones previas
        if (["EFECTIVO_BS", "PAGO_MOVIL", "TRANSFERENCIA", "PUNTO", "MIXTO"].includes(metodoPago) && (!tasaDolar || Number(tasaDolar) <= 0)) {
            toast.error("Debe ingresar una Tasa BCV válida para usar Bolívares");
            return;
        }

        let pagosParaBackend = undefined;
        if (metodoPago === "MIXTO") {
            const sumUSD = pagosMixtos.reduce((s, p) => s + (Number(p.montoUSD) || 0), 0);
            if (pagosMixtos.length < 2) {
                toast.error("Un pago mixto requiere al menos 2 métodos");
                return;
            }
            if (Math.abs(sumUSD - totalVenta) > 0.05) { // allowed a small precision difference
                toast.error(`La suma de los pagos ($${sumUSD.toFixed(2)}) no coincide con el total ($${totalVenta.toFixed(2)})`);
                return;
            }
            pagosParaBackend = pagosMixtos.map(p => ({
                metodoPago: p.metodoPago,
                montoUSD: Number(p.montoUSD),
                montoBs: Number(p.montoBs) || undefined,
                referencia: p.referencia || undefined
            }));
        }

        startTransition(async () => {
            const resultado = await crearVenta({
                perfilClienteId: clienteSeleccionado?.id,
                metodoPago,
                tasaDolar: Number(tasaDolar) || undefined,
                pagos: pagosParaBackend,
                observaciones: `Venta POS - ${new Date().toLocaleString()}`,
                detalles: carrito.map(p => ({
                    productoId: p.id,
                    cantidad: p.cantidad,
                    precioUnitario: p.precio
                }))
            });

            if (resultado.success) {
                toast.success("¡Venta registrada con éxito!");
                setCarrito([]);
                setClienteSeleccionado(null);
                setClienteQuery("");
                setPagosMixtos([]);
                setMetodoPago("EFECTIVO_BS");
                router.refresh();
            } else {
                toast.error(resultado.error || "Error al procesar venta");
            }
        });
    };

    const registrarClienteRapido = async () => {
        if (!nuevoCliente.nombre || !nuevoCliente.cedula || !nuevoCliente.telefono) {
            toast.error("Nombre, Cédula y Teléfono son obligatorios");
            return;
        }
        if (nuevoCliente.cedula.length < 6 || nuevoCliente.cedula.length > 9) {
            toast.error("La cédula debe tener entre 6 y 9 dígitos");
            return;
        }
        if (nuevoCliente.telefono.length !== 11) {
            toast.error("El teléfono debe tener 11 dígitos");
            return;
        }
        startTransition(async () => {
            const res = await obtenerOCrearPerfilCliente({
                ...nuevoCliente
            });
            if (res.success) {
                // Adaptamos la respuesta del perfil al estado del componente
                const perfilAdaptado = {
                    id: res.data.id,
                    nombre: res.data.usuario.nombre,
                    cedula: res.data.usuario.cedula
                };
                setClienteSeleccionado(perfilAdaptado);
                setClienteQuery(res.data.usuario.nombre);
                setShowClienteForm(false);
                toast.success("Cliente vinculado correctamente");
            } else {
                toast.error(res.error);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Punto de Venta</h1>
                </div>
            </div>

            <div className="flex h-[calc(100vh-170px)] gap-6">
                {/* SECCIÓN IZQUIERDA: Productos */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* Resultados de Búsqueda (Grid) */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        {productos.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {productos.map((producto) => (
                                    <div
                                        key={producto.id}
                                        onClick={() => agregarAlCarrito(producto)}
                                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group"
                                    >
                                        <div className="aspect-square relative bg-slate-50 rounded-lg mb-3 overflow-hidden">
                                            {producto.imagenPrincipal ? (
                                                <Image src={producto.imagenPrincipal} alt={producto.nombre} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <ShoppingCart className="w-8 h-8" />
                                                </div>
                                            )}
                                            {producto.stock <= 0 && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-bold text-red-500">
                                                    AGOTADO
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-slate-900 group-hover:text-blue-600 line-clamp-2 text-sm h-10">
                                            {producto.nombre}
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-2">{producto.codigoOEM || 'S/C'}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-lg text-slate-900">${producto.precio}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${producto.stock > 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                Stock: {producto.stock}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <Search className="w-16 h-16 mb-4" />
                                <p>Busca productos para comenzar la venta</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN DERECHA: Buscador, Carrito y Checkout */}
                <div className="w-[500px] flex flex-col gap-6">
                    {/* Buscador de Productos (Alineado con el Título en el eje Y) */}
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar producto (OEM o Nombre)..."
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 text-sm"
                            autoFocus
                        />
                    </div>

                    <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                <ShoppingCart className="w-4 h-4 text-blue-600" />
                                Carrito de Compra
                            </h2>
                        </div>

                        {/* Lista de Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {carrito.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <p className="text-sm">El carrito está vacío</p>
                                </div>
                            ) : (
                                carrito.map((item) => (
                                    <div key={item.id} className="flex gap-3 bg-slate-50 p-3 rounded-lg group">
                                        <div className="w-12 h-12 bg-white rounded border border-slate-200 relative shrink-0 overflow-hidden">
                                            {item.imagen && <Image src={item.imagen} alt="" fill className="object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-sm text-slate-900 truncate pr-2">{item.nombre}</h4>
                                                <button onClick={() => eliminarDelCarrito(item.id)} className="text-slate-400 hover:text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-1">
                                                    <button onClick={() => actualizarCantidad(item.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-600"><Minus className="w-3 h-3" /></button>
                                                    <span className="text-xs font-semibold w-6 text-center">{item.cantidad}</span>
                                                    <button onClick={() => actualizarCantidad(item.id, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-600"><Plus className="w-3 h-3" /></button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400">${item.precio} c/u</p>
                                                    <p className="font-bold text-slate-900">${(item.precio * item.cantidad).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Selector de Cliente */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                            {clienteSeleccionado ? (
                                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <div>
                                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Cliente Asignado</p>
                                        <p className="font-medium text-blue-900">{clienteSeleccionado.nombre}</p>
                                        <p className="text-xs text-blue-700">{clienteSeleccionado.cedula}</p>
                                    </div>
                                    <button onClick={() => { setClienteSeleccionado(null); setClienteQuery(""); }} className="text-blue-400 hover:text-blue-700">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    {!showClienteForm ? (
                                        <>
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Buscar cliente (Cédula o Nombre)..."
                                                className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                                                value={clienteQuery}
                                                onChange={(e) => setClienteQuery(e.target.value)}
                                            />
                                            <button
                                                onClick={() => setShowClienteForm(true)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="Crear Nuevo Cliente"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                            </button>

                                            {/* Dropdown de Resultados */}
                                            {clientesEncontrados.length > 0 && (
                                                <div className="absolute bottom-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg mb-2 overflow-hidden z-10 max-h-48 overflow-y-auto">
                                                    {clientesEncontrados.map(c => (
                                                        <div
                                                            key={c.id}
                                                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                            onClick={() => { setClienteSeleccionado(c); setClientesEncontrados([]); setClienteQuery(c.nombre); }}
                                                        >
                                                            <p className="font-medium text-sm text-slate-900">{c.nombre}</p>
                                                            <p className="text-xs text-slate-500">CI: {c.cedula}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-xs font-bold text-slate-700 uppercase">Nuevo Cliente</h4>
                                                <button onClick={() => setShowClienteForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
                                            </div>
                                            <div className="space-y-3">
                                                <input
                                                    placeholder="Nombre Completo"
                                                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={nuevoCliente.nombre}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                                                        setNuevoCliente({ ...nuevoCliente, nombre: val });
                                                    }}
                                                />

                                                <div>
                                                    <input
                                                        placeholder="Cédula (6-9 dígitos)"
                                                        className={`w-full px-2 py-1.5 text-sm border rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${nuevoCliente.cedula && (nuevoCliente.cedula.length < 6 || nuevoCliente.cedula.length > 9)
                                                            ? 'border-red-300 focus:ring-red-200 bg-red-50'
                                                            : 'border-slate-300 focus:ring-blue-500'
                                                            }`}
                                                        value={nuevoCliente.cedula}
                                                        inputMode="numeric"
                                                        maxLength={9}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setNuevoCliente({ ...nuevoCliente, cedula: val });
                                                        }}
                                                    />
                                                    {nuevoCliente.cedula && (nuevoCliente.cedula.length < 6) && (
                                                        <p className="text-[10px] text-red-500 mt-1 ml-1">Mínimo 6 dígitos</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <input
                                                        placeholder="Teléfono (11 dígitos)"
                                                        className={`w-full px-2 py-1.5 text-sm border rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${nuevoCliente.telefono && nuevoCliente.telefono.length !== 11
                                                            ? 'border-red-300 focus:ring-red-200 bg-red-50'
                                                            : 'border-slate-300 focus:ring-blue-500'
                                                            }`}
                                                        value={nuevoCliente.telefono}
                                                        inputMode="numeric"
                                                        maxLength={11}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setNuevoCliente({ ...nuevoCliente, telefono: val });
                                                        }}
                                                    />
                                                    {nuevoCliente.telefono && nuevoCliente.telefono.length !== 11 && (
                                                        <p className="text-[10px] text-red-500 mt-1 ml-1">Debe tener exactamente 11 dígitos</p>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={registrarClienteRapido}
                                                    disabled={
                                                        isPending ||
                                                        !nuevoCliente.nombre ||
                                                        !nuevoCliente.cedula ||
                                                        nuevoCliente.cedula.length < 6 ||
                                                        nuevoCliente.cedula.length > 9 ||
                                                        !nuevoCliente.telefono ||
                                                        nuevoCliente.telefono.length !== 11
                                                    }
                                                    className="w-full bg-slate-900 text-white text-xs font-medium py-2 rounded mt-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {isPending ? "Guardando..." : "Guardar Cliente"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Totales y Pago */}
                        <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                    <span className="text-sm font-semibold text-blue-900">Tasa del Día (Bs/$)</span>
                                    <div className="relative w-32">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Bs</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={tasaDolar}
                                            onChange={(e) => setTasaDolar(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="0.00"
                                            className="w-full pl-9 pr-3 py-1.5 text-right font-bold text-slate-900 bg-white border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-slate-500 font-medium text-sm block">Total USD</span>
                                        <span className="text-3xl font-black text-emerald-600">${totalVenta.toFixed(2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-500 font-medium text-xs block">Equivalente Bs</span>
                                        <span className="text-xl font-bold text-slate-800">
                                            {tasaDolar ? `Bs ${(totalVenta * Number(tasaDolar)).toFixed(2)}` : 'Bs 0.00'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Método de Pago</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["EFECTIVO_BS", "PAGO_MOVIL", "TRANSFERENCIA", "PUNTO", "DIVISA", "MIXTO"] as MetodoPago[]).map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMetodoPago(m)}
                                            className={`text-[10px] font-bold py-2 px-1 rounded border transition-all truncate text-center ${metodoPago === m
                                                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                                }`}
                                            title={m.replace("_", " ")}
                                        >
                                            {m.replace("_", " ")}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {metodoPago === "MIXTO" && (
                                <div className="mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-slate-700">Desglose Mixto</h4>
                                        <button
                                            onClick={() => setPagosMixtos([...pagosMixtos, { id: Date.now().toString(), metodoPago: "PAGO_MOVIL", montoUSD: 0 }])}
                                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                                        >
                                            <Plus className="w-3 h-3" /> Agregar
                                        </button>
                                    </div>
                                    {pagosMixtos.map((pago, index) => (
                                        <div key={pago.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start bg-slate-50 p-2 rounded border border-slate-100">
                                            <select
                                                value={pago.metodoPago}
                                                onChange={(e) => {
                                                    const newPagos = [...pagosMixtos];
                                                    newPagos[index].metodoPago = e.target.value as MetodoPago;
                                                    setPagosMixtos(newPagos);
                                                }}
                                                className="text-xs border-slate-300 rounded py-1 px-2 w-full focus:ring-blue-500"
                                            >
                                                <option value="EFECTIVO_BS">Efectivo Bs</option>
                                                <option value="PAGO_MOVIL">Pago Móvil</option>
                                                <option value="TRANSFERENCIA">Transferencia</option>
                                                <option value="PUNTO">Punto</option>
                                                <option value="DIVISA">Divisa (USD)</option>
                                            </select>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">$</span>
                                                <input
                                                    type="number" step="0.01" placeholder="Monto $"
                                                    value={pago.montoUSD || ''}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        const newPagos = [...pagosMixtos];
                                                        newPagos[index].montoUSD = val;
                                                        if (tasaDolar && ["EFECTIVO_BS", "PAGO_MOVIL", "TRANSFERENCIA", "PUNTO"].includes(pago.metodoPago)) {
                                                            newPagos[index].montoBs = val * Number(tasaDolar);
                                                        }
                                                        setPagosMixtos(newPagos);
                                                    }}
                                                    className="w-full pl-5 pr-2 py-1 text-[11px] border-slate-300 rounded focus:ring-blue-500 font-medium"
                                                />
                                            </div>
                                            <button onClick={() => setPagosMixtos(pagosMixtos.filter((_, i) => i !== index))} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded mt-0.5">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            {["PAGO_MOVIL", "TRANSFERENCIA"].includes(pago.metodoPago) && (
                                                <input
                                                    type="text" placeholder="Referencia (ej: 0145...)"
                                                    value={pago.referencia || ''}
                                                    onChange={(e) => {
                                                        const newPagos = [...pagosMixtos];
                                                        newPagos[index].referencia = e.target.value;
                                                        setPagosMixtos(newPagos);
                                                    }}
                                                    className="col-span-3 mt-1 w-full px-2 py-1 text-[10px] border-slate-300 rounded focus:ring-blue-500"
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-100">
                                        <span className="text-slate-500">Restante:</span>
                                        <span className={`font-bold ${totalVenta - pagosMixtos.reduce((s, p) => s + (Number(p.montoUSD) || 0), 0) === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            ${Math.max(0, totalVenta - pagosMixtos.reduce((s, p) => s + (Number(p.montoUSD) || 0), 0)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={procesarVenta}
                                disabled={carrito.length === 0 || isPending}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all transform active:scale-95"
                            >
                                {isPending ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Confirmar Venta
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
