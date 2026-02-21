'use client';

import { useState, useEffect } from 'react';
import { X, Store, Save, AlertCircle, MapPin } from 'lucide-react';
import { createTienda, updateTienda } from '@/lib/actions-tienda';
import { ScheduleEditor, WeeklySchedule } from './ScheduleEditor';

const ESTADOS_VENEZUELA = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas',
    'Bolívar', 'Cojedes', 'Delta Amacuro', 'Distrito Capital',
    'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda',
    'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira',
    'Trujillo', 'Vargas', 'Yaracuy', 'Zulia',
];

interface TiendaToEdit {
    id: string;
    nombre: string;
    telefono: string;
    whatsapp: string | null;
    ciudad: string;
    estado: string;
    direccion: string;
    googleMapsUrl: string | null;
    horario: any; // Using any to avoid complex casting from JSON
}

interface CreateTiendaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tiendaToEdit?: TiendaToEdit | null;
}

export function CreateTiendaModal({ isOpen, onClose, onSuccess, tiendaToEdit }: CreateTiendaModalProps) {
    const isEditing = !!tiendaToEdit;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [estado, setEstado] = useState('');
    const [direccion, setDireccion] = useState('');
    const [googleMapsUrl, setGoogleMapsUrl] = useState('');
    const [horario, setHorario] = useState<WeeklySchedule | null>(null);

    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

    const isValid =
        nombre.trim().length > 0 &&
        telefono.trim().length >= 7 &&
        ciudad.trim().length > 0 &&
        estado.trim().length > 0 &&
        direccion.trim().length > 0;

    useEffect(() => {
        if (isOpen) {
            if (tiendaToEdit) {
                setNombre(tiendaToEdit.nombre);
                setTelefono(tiendaToEdit.telefono);
                setWhatsapp(tiendaToEdit.whatsapp || '');
                setCiudad(tiendaToEdit.ciudad);
                setEstado(tiendaToEdit.estado);
                setDireccion(tiendaToEdit.direccion);
                setGoogleMapsUrl(tiendaToEdit.googleMapsUrl || '');
                setHorario(tiendaToEdit.horario as WeeklySchedule);
            } else {
                setNombre('');
                setTelefono('');
                setWhatsapp('');
                setCiudad('');
                setEstado('');
                setDireccion('');
                setGoogleMapsUrl('');
                setHorario(null);
            }
            setTouched({});
            setError('');
        }
    }, [isOpen, tiendaToEdit]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid) return;

        setIsLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('nombre', nombre.trim());
        formData.append('telefono', telefono.trim());
        formData.append('whatsapp', whatsapp.trim());
        formData.append('ciudad', ciudad.trim());
        formData.append('estado', estado);
        formData.append('direccion', direccion.trim());
        formData.append('googleMapsUrl', googleMapsUrl.trim());
        if (horario) {
            formData.append('horario', JSON.stringify(horario));
        }

        let result;
        if (isEditing && tiendaToEdit) {
            formData.append('id', tiendaToEdit.id);
            result = await updateTienda(formData);
        } else {
            result = await createTienda(formData);
        }

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            setIsLoading(false);
            onSuccess();
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2.5 rounded-xl">
                            <Store className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {isEditing ? 'Editar Tienda' : 'Nueva Tienda'}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {isEditing ? 'Modifica los datos de tu tienda' : 'Registra los datos de tu tienda'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="overflow-y-auto p-6 space-y-5">
                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Nombre de la tienda *</label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            onBlur={() => handleBlur('nombre')}
                            placeholder="Ej: Repuestos JM"
                            className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.nombre && !nombre.trim()
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                        />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Teléfono *</label>
                        <input
                            type="text"
                            id="telefono"
                            name="telefono"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value.replace(/[^0-9\-+() ]/g, ''))}
                            onBlur={() => handleBlur('telefono')}
                            placeholder="Ej: 0412-1234567"
                            className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.telefono && telefono.trim().length < 7
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                        />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">WhatsApp <span className="text-slate-400 font-normal">(Opcional)</span></label>
                        <input
                            type="text"
                            id="whatsapp"
                            name="whatsapp"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9\-+() ]/g, ''))}
                            placeholder="Ej: +58 412-1234567"
                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        />
                    </div>

                    {/* Estado y Ciudad */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Estado *</label>
                            <div className="relative">
                                <select
                                    id="estado"
                                    name="estado"
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value)}
                                    onBlur={() => handleBlur('estado')}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 outline-none appearance-none cursor-pointer ${touched.estado && !estado
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                        }`}
                                >
                                    <option value="">Seleccionar</option>
                                    {ESTADOS_VENEZUELA.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Ciudad *</label>
                            <input
                                type="text"
                                id="ciudad"
                                name="ciudad"
                                value={ciudad}
                                onChange={(e) => setCiudad(e.target.value)}
                                onBlur={() => handleBlur('ciudad')}
                                placeholder="Ej: Anaco"
                                className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.ciudad && !ciudad.trim()
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                    }`}
                            />
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Dirección *</label>
                        <textarea
                            id="direccion"
                            name="direccion"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            onBlur={() => handleBlur('direccion')}
                            placeholder="Ej: Av. Principal, CC Centro, Local 12"
                            rows={3}
                            className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none resize-none ${touched.direccion && !direccion.trim()
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                        />
                    </div>

                    {/* Google Maps URL */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Ubicación en Google Maps <span className="text-slate-400 font-normal">(Opcional)</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPin className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                id="googleMapsUrl"
                                name="googleMapsUrl"
                                value={googleMapsUrl}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Extract src if iframe code is pasted
                                    const srcMatch = val.match(/src="([^"]+)"/);
                                    setGoogleMapsUrl(srcMatch ? srcMatch[1] : val);
                                }}
                                placeholder='Pega aquí el código HTML de "Incorporar un mapa"'
                                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            />
                        </div>
                        <p className="text-xs text-slate-400">
                            Ve a Google Maps, busca tu tienda, elige <strong>"Compartir" &gt; "Incorporar un mapa"</strong>, copia el HTML y pégalo aquí.
                        </p>
                    </div>

                    {/* Schedule Editor */}
                    <ScheduleEditor
                        value={horario}
                        onChange={setHorario}
                    />

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 mt-auto">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || isLoading}
                        className="flex-1 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-blue-500/25 shadow-lg shadow-blue-500/10 transition-all disabled:opacity-50 disabled:grayscale disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {isEditing ? 'Guardando...' : 'Registrando...'}
                            </>
                        ) : (
                            <>
                                {isEditing ? <Save className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                                {isEditing ? 'Guardar Cambios' : 'Crear Tienda'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
