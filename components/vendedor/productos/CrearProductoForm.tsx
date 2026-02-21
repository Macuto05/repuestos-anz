'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Info, ImageIcon, Car, Plus, Trash2, Save,
    Upload, X, ChevronRight, Pencil
} from 'lucide-react';
import { createProducto, updateProducto } from '@/lib/actions-productos';
import { analyzeProductData } from '@/lib/actions-ia';
import { toast } from 'sonner';

interface Categoria {
    id: string;
    nombre: string;
}

interface MarcaVehiculo {
    id: string;
    nombre: string;
}

interface CompatibilidadRow {
    tempId: string;
    marcaId: string;
    marcaNombre: string;
    modelo: string;
    anoInicio: string;
    anoFin: string;
    motor: string;
    notas: string;
}

interface ImagePreview {
    id: string;
    file?: File;
    url: string;
    isExisting?: boolean;
}

interface InitialProductData {
    id: string;
    nombre: string;
    codigoOEM: string | null;
    categoriaId: string;
    marcaRepuesto: string;
    descripcion: string | null;
    precio: number;
    stock: number;
    stockMinimo: number;
    disponible: boolean;
    imagenes: string[];
    imagenPrincipal: string | null;
    compatibilidades: {
        marcaId: string;
        marcaNombre: string;
        modeloNombre: string | null;
        anoInicio: number | null;
        anoFin: number | null;
        motor: string | null;
        notas: string | null;
    }[];
}

interface CrearProductoFormProps {
    categorias: Categoria[];
    marcas: MarcaVehiculo[];
    mode?: 'create' | 'edit';
    initialData?: InitialProductData;
}

export function CrearProductoForm({ categorias, marcas, mode = 'create', initialData }: CrearProductoFormProps) {
    const router = useRouter();
    const isEdit = mode === 'edit';

    // Form state - Información General
    const [nombre, setNombre] = useState(initialData?.nombre || '');
    const [codigoOEM, setCodigoOEM] = useState(initialData?.codigoOEM || '');
    const [categoriaId, setCategoriaId] = useState(initialData?.categoriaId || '');
    const [marcaRepuesto, setMarcaRepuesto] = useState(initialData?.marcaRepuesto || '');
    const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
    const [precio, setPrecio] = useState(initialData ? String(initialData.precio) : '');
    const [stock, setStock] = useState(initialData ? String(initialData.stock) : '');
    const [stockMinimo, setStockMinimo] = useState(initialData ? String(initialData.stockMinimo) : '');
    const [disponible, setDisponible] = useState(initialData?.disponible ?? true);

    // Images state
    const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>(() => {
        if (initialData?.imagenes?.length) {
            return initialData.imagenes.map((url, i) => ({
                id: `existing-${i}`,
                url,
                isExisting: true,
            }));
        }
        return [];
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_IMAGES = 5;

    // Compatibilidad state
    const [compatibilidades, setCompatibilidades] = useState<CompatibilidadRow[]>(() => {
        if (initialData?.compatibilidades?.length) {
            return initialData.compatibilidades.map(c => ({
                tempId: crypto.randomUUID(),
                marcaId: c.marcaId,
                marcaNombre: c.marcaNombre,
                modelo: c.modeloNombre || '',
                anoInicio: c.anoInicio ? String(c.anoInicio) : '',
                anoFin: c.anoFin ? String(c.anoFin) : '',
                motor: c.motor || '',
                notas: c.notas || '',
            }));
        }
        return [];
    });
    const [showCompatForm, setShowCompatForm] = useState(false);
    const [compatMarcaId, setCompatMarcaId] = useState('');
    const [compatModelo, setCompatModelo] = useState('');
    const [compatAnoInicio, setCompatAnoInicio] = useState('');
    const [compatAnoFin, setCompatAnoFin] = useState('');
    const [compatMotor, setCompatMotor] = useState('');

    // Submission
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    // AI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- Image Processing ---
    const convertImageToWebP = async (file: File): Promise<File> => {
        if (file.type === 'image/webp') return file; // Skip conversion if already WebP
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo obtener el contexto del canvas'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    } else {
                        reject(new Error('Error al convertir a WebP'));
                    }
                }, 'image/webp', 0.8); // 0.8 quality
            };
            img.onerror = () => reject(new Error('Error al cargar la imagen'));
            img.src = URL.createObjectURL(file);
        });
    };

    // --- AI Handler ---
    const handleAIAutocomplete = async () => {
        if (!nombre.trim()) {
            toast.error('Primero escribe el nombre del producto');
            return;
        }

        setIsAnalyzing(true);
        const toastId = toast.loading('Generando datos con IA...');

        try {
            const result = await analyzeProductData(nombre, categorias);

            if (result.success && result.data) {
                const { marcaRepuesto: iaMarca, codigo_oem, descripcion: iaDesc, categoriaId: iaCategoria } = result.data;

                // Update fields if they are empty or user wants to overwrite (we just overwrite for now)
                if (iaMarca) setMarcaRepuesto(iaMarca);
                if (codigo_oem) setCodigoOEM(codigo_oem);
                if (iaCategoria) setCategoriaId(iaCategoria); // Auto-select category

                let finalDesc = iaDesc || '';
                setDescripcion(finalDesc);

                toast.success('¡Datos generados con éxito!', { id: toastId });
            } else {
                toast.error('No se pudieron generar datos para este nombre.', { id: toastId });
            }

        } catch (error) {
            console.error(error);
            toast.error('Error al consultar la IA.', { id: toastId });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remaining = MAX_IMAGES - imagePreviews.length;
        const newFiles = Array.from(files).slice(0, remaining);

        const toastId = toast.loading('Optimizando imágenes...');

        try {
            const processedFiles = await Promise.all(newFiles.map(file => convertImageToWebP(file)));

            const newPreviews: ImagePreview[] = processedFiles.map(file => ({
                id: crypto.randomUUID(),
                file,
                url: URL.createObjectURL(file), // WebP URL
            }));

            setImagePreviews(prev => [...prev, ...newPreviews]);
            toast.dismiss(toastId);
            toast.success('Imágenes optimizadas a WebP');
        } catch (error) {
            console.error(error);
            toast.error('Error al procesar algunas imágenes', { id: toastId });
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (!files) return;

        const remaining = MAX_IMAGES - imagePreviews.length;
        const validFiles = Array.from(files)
            .filter(f => f.type.startsWith('image/'))
            .slice(0, remaining);

        if (validFiles.length === 0) return;

        const toastId = toast.loading('Optimizando imágenes...');

        try {
            const processedFiles = await Promise.all(validFiles.map(file => convertImageToWebP(file)));

            const newPreviews: ImagePreview[] = processedFiles.map(file => ({
                id: crypto.randomUUID(),
                file,
                url: URL.createObjectURL(file),
            }));

            setImagePreviews(prev => [...prev, ...newPreviews]);
            toast.dismiss(toastId);
            toast.success('Imágenes optimizadas a WebP');
        } catch (error) {
            console.error(error);
            toast.error('Error al procesar imágenes', { id: toastId });
        }
    };

    const removeImage = (id: string) => {
        setImagePreviews(prev => {
            const toRemove = prev.find(p => p.id === id);
            if (toRemove) URL.revokeObjectURL(toRemove.url);
            return prev.filter(p => p.id !== id);
        });
    };

    // --- Compatibilidad Handlers ---
    const [compatError, setCompatError] = useState('');
    const [editingCompatId, setEditingCompatId] = useState<string | null>(null);

    const addCompatibilidad = () => {
        if (!compatMarcaId) return;
        setCompatError('');

        // Validate: if one year is set, the other must be too
        if ((compatAnoInicio && !compatAnoFin) || (!compatAnoInicio && compatAnoFin)) {
            setCompatError('Debes indicar ambos años (inicio y fin) o dejar ambos vacíos.');
            return;
        }

        // Validate: start year <= end year
        if (compatAnoInicio && compatAnoFin && parseInt(compatAnoInicio) > parseInt(compatAnoFin)) {
            setCompatError('El año de inicio no puede ser mayor al año de fin.');
            return;
        }

        const marcaNombre = marcas.find(m => m.id === compatMarcaId)?.nombre || '';

        const newRow: CompatibilidadRow = {
            tempId: crypto.randomUUID(),
            marcaId: compatMarcaId,
            marcaNombre,
            modelo: compatModelo,
            anoInicio: compatAnoInicio,
            anoFin: compatAnoFin,
            motor: compatMotor,
            notas: '',
        };

        // If editing, remove old row
        if (editingCompatId) {
            setCompatibilidades(prev => [...prev.filter(c => c.tempId !== editingCompatId), newRow]);
            setEditingCompatId(null);
        } else {
            setCompatibilidades(prev => [...prev, newRow]);
        }

        // Reset form
        setCompatMarcaId('');
        setCompatModelo('');
        setCompatAnoInicio('');
        setCompatAnoFin('');
        setCompatMotor('');
        setShowCompatForm(false);
    };

    const editCompatibilidad = (tempId: string) => {
        const row = compatibilidades.find(c => c.tempId === tempId);
        if (!row) return;
        setCompatMarcaId(row.marcaId);
        setCompatModelo(row.modelo);
        setCompatAnoInicio(row.anoInicio);
        setCompatAnoFin(row.anoFin);
        setCompatMotor(row.motor);
        setEditingCompatId(tempId);
        setCompatError('');
        setShowCompatForm(true);
    };

    const removeCompatibilidad = (tempId: string) => {
        setCompatibilidades(prev => prev.filter(c => c.tempId !== tempId));
    };

    // --- Submit Handler ---
    const handleSubmit = async () => {
        setError('');
        setSaving(true);

        // Basic validation
        if (!nombre.trim()) { setError('El nombre es obligatorio'); setSaving(false); return; }
        if (!precio) { setError('El precio es obligatorio'); setSaving(false); return; }
        if (stock === '') { setError('El stock inicial es obligatorio (puede ser 0)'); setSaving(false); return; }
        if (stockMinimo === '') { setError('El stock mínimo es obligatorio'); setSaving(false); return; }

        try {
            const formData = new FormData();
            formData.set('nombre', nombre);
            formData.set('codigoOEM', codigoOEM);
            formData.set('categoriaId', categoriaId);
            formData.set('marcaRepuesto', marcaRepuesto);
            formData.set('descripcion', descripcion);
            formData.set('precio', precio);
            formData.set('stock', stock);
            formData.set('stockMinimo', stockMinimo);
            formData.set('disponible', disponible.toString());

            // Serialize compatibilities
            const compatData = compatibilidades.map(c => ({
                marcaId: c.marcaId,
                anoInicio: c.anoInicio ? parseInt(c.anoInicio) : undefined,
                anoFin: c.anoFin ? parseInt(c.anoFin) : undefined,
                motor: c.motor || undefined,
                notas: c.modelo || undefined,
            }));
            formData.set('compatibilidades', JSON.stringify(compatData));

            // Separate existing images (kept URLs) from new uploads
            const existingImages = imagePreviews.filter(img => img.isExisting).map(img => img.url);
            const newImages = imagePreviews.filter(img => !img.isExisting && img.file);

            if (isEdit) {
                formData.set('existingImages', JSON.stringify(existingImages));
            }

            newImages.forEach((img) => {
                if (img.file) formData.append('imagenes', img.file);
            });

            const result = isEdit && initialData
                ? await updateProducto(initialData.id, formData)
                : await createProducto(formData);

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/productos');
                router.refresh();
            }
        } catch (err) {
            setError('Error inesperado al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        setNombre('');
        setCodigoOEM('');
        setCategoriaId('');
        setMarcaRepuesto('');
        setDescripcion('');
        setPrecio('');
        setStock('');
        setStockMinimo('');
        setDisponible(true);
        setImagePreviews([]);
        setCompatibilidades([]);
        setCompatMarcaId('');
        setCompatModelo('');
        setCompatAnoInicio('');
        setCompatAnoFin('');
        setCompatMotor('');
        setShowCompatForm(false);
        setError('');
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/productos" className="hover:text-blue-600 transition-colors">Panel</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href="/productos" className="hover:text-blue-600 transition-colors">Productos</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-900 font-medium">{isEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}</h1>

            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Main Grid: Info General + Imágenes */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Información General (3 cols) */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
                            <Info className="w-5 h-5 text-blue-500" />
                            Información General
                        </div>
                        {/* AI Button */}
                        <button
                            type="button"
                            onClick={handleAIAutocomplete}
                            disabled={!nombre || isAnalyzing}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${nombre && !isAnalyzing
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:from-violet-500 hover:to-indigo-500'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                                    </svg>
                                    Autocompletar Datos (IA)
                                </>
                            )}
                        </button>
                    </div>

                    {/* Nombre */}
                    <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Nombre del Producto
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Kit de Embrague para Toyota Corolla"
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    {/* SKU + Categoría + Marca Repuesto */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="codigoOEM" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Código OEM
                            </label>
                            <input
                                type="text"
                                id="codigoOEM"
                                name="codigoOEM"
                                value={codigoOEM}
                                onChange={(e) => setCodigoOEM(e.target.value)}
                                placeholder="Ej: 90915-YZZD2"
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="categoriaId" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Categoría
                            </label>
                            <select
                                id="categoriaId"
                                name="categoriaId"
                                value={categoriaId}
                                onChange={(e) => setCategoriaId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            >
                                <option value="">Seleccionar...</option>
                                {categorias.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="marcaRepuesto" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Marca del Repuesto
                            </label>
                            <input
                                type="text"
                                id="marcaRepuesto"
                                name="marcaRepuesto"
                                value={marcaRepuesto}
                                onChange={(e) => setMarcaRepuesto(e.target.value)}
                                placeholder="Ej: Bosch, Valeo"
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Descripción Detallada
                        </label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Describe las especificaciones técnicas..."
                            rows={5}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y"
                        />
                    </div>

                    {/* Precio (Fila sola) */}
                    <div>
                        <label htmlFor="precio" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Precio ($)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                id="precio"
                                name="precio"
                                value={precio}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    const parts = val.split('.');
                                    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                                    setPrecio(sanitized);
                                }}
                                placeholder="0.00"
                                className="w-full pl-7 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Stock Inicial + Stock Mínimo + Disponible */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4  items-end">
                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Stock Inicial
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                id="stock"
                                name="stock"
                                value={stock}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setStock(val);
                                }}
                                placeholder="0"
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="stockMinimo" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Stock Mínimo
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                id="stockMinimo"
                                name="stockMinimo"
                                value={stockMinimo}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setStockMinimo(val);
                                }}
                                placeholder="1"
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 pb-2.5">
                            <span className="text-sm font-medium text-slate-700">Disponible</span>
                            <button
                                type="button"
                                onClick={() => setDisponible(!disponible)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${disponible ? 'bg-blue-600' : 'bg-slate-200'
                                    }`}
                            >
                                <span
                                    className={`${disponible ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Imágenes del Producto (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                        Imágenes del Producto
                    </div>

                    {/* Drop zone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                            <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">Arrastra las imágenes aquí</p>
                        <p className="text-xs text-slate-400">PNG, JPG o WEBP hasta 5MB</p>
                        <button
                            type="button"
                            className="mt-1 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Seleccionar Archivos
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                    </div>

                    {/* Previews */}
                    {imagePreviews.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-slate-600 mb-2">
                                Vistas previas ({imagePreviews.length}/{MAX_IMAGES})
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {imagePreviews.map((img, index) => (
                                    <div key={img.id} className={`relative aspect-square rounded-lg overflow-hidden border ${index === 0 ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'} group bg-slate-50`}>
                                        <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                                        {index === 0 && (
                                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                                                Principal
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(img.id)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {imagePreviews.length < MAX_IMAGES && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 transition-colors"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {imagePreviews.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700">
                                📸 Las imágenes se subirán automáticamente al guardar el producto.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Compatibilidad con vehículos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
                        <Car className="w-5 h-5 text-blue-500" />
                        Compatibilidad con vehículos
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCompatForm(!showCompatForm)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar
                    </button>
                </div>

                {/* Inline Add Form */}
                {showCompatForm && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        {compatError && (
                            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
                                {compatError}
                            </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Marca</label>
                                <select
                                    value={compatMarcaId}
                                    onChange={(e) => setCompatMarcaId(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="">Seleccionar...</option>
                                    {marcas.map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Modelo</label>
                                <input
                                    type="text"
                                    value={compatModelo}
                                    onChange={(e) => setCompatModelo(e.target.value)}
                                    placeholder="Ej: Corolla, Civic"
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Año Inicio</label>
                                    <input
                                        type="number"
                                        value={compatAnoInicio}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 2099)) setCompatAnoInicio(val);
                                        }}
                                        placeholder="2008"
                                        min="1900"
                                        max="2099"
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Año Fin</label>
                                    <input
                                        type="number"
                                        value={compatAnoFin}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 2099)) setCompatAnoFin(val);
                                        }}
                                        placeholder="2014"
                                        min="1900"
                                        max="2099"
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Motor / Notas</label>
                                <input
                                    type="text"
                                    value={compatMotor}
                                    onChange={(e) => setCompatMotor(e.target.value)}
                                    placeholder="1.8L VVTi"
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => { setShowCompatForm(false); setEditingCompatId(null); setCompatError(''); setCompatMarcaId(''); setCompatModelo(''); setCompatAnoInicio(''); setCompatAnoFin(''); setCompatMotor(''); }}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={addCompatibilidad}
                                disabled={!compatMarcaId}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {editingCompatId ? 'Guardar Cambios' : 'Agregar Vehículo'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Compatibility Table */}
                {compatibilidades.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Marca</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Modelo</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Años</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Motor / Notas</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {compatibilidades.map((c) => (
                                    <tr key={c.tempId} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 text-sm text-slate-700">{c.marcaNombre}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{c.modelo || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            {c.anoInicio && c.anoFin ? `${c.anoInicio} - ${c.anoFin}` : c.anoInicio || c.anoFin || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{c.motor || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => editCompatibilidad(c.tempId)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCompatibilidad(c.tempId)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    !showCompatForm && (
                        <p className="text-sm text-slate-400 text-center py-6">
                            Aún no has agregado compatibilidades. Haz clic en &quot;+ Agregar&quot; para comenzar.
                        </p>
                    )
                )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <button
                    type="button"
                    onClick={handleDiscard}
                    className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                    Descartar Borrador
                </button>
                <div className="flex items-center gap-3">
                    <Link
                        href="/productos"
                        className="px-5 py-2.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving || !nombre || !categoriaId || !marcaRepuesto || !precio}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : (isEdit ? 'Actualizar Producto' : 'Guardar Producto')}
                    </button>
                </div>
            </div>

            {/* Bottom Tip */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                    Asegúrate de listar todos los modelos compatibles para mejorar el posicionamiento en las búsquedas internas. Los campos son editables directamente.
                </p>
            </div>
        </div >
    );
}
