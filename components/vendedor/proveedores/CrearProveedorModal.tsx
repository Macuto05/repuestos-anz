'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, Truck, Plus } from 'lucide-react';
import { crearProveedor, actualizarProveedor } from '@/lib/actions-proveedores';

const CODIGOS_TELEFONO = [
    '0412', '0422', '0414', '0424', '0416', '0426', '0281', '0212'
];

interface CrearProveedorModalProps {
    isOpen: boolean;
    onClose: () => void;
    proveedorAEditar?: any;
    onSuccess: () => void;
}

export function CrearProveedorModal({ isOpen, onClose, proveedorAEditar, onSuccess }: CrearProveedorModalProps) {
    const isEditing = !!proveedorAEditar;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [nombre, setNombre] = useState('');
    // RIF is always J for now as per requirement
    const [rifNum, setRifNum] = useState('');
    const [telefonoCodigo, setTelefonoCodigo] = useState('');
    const [telefonoNum, setTelefonoNum] = useState('');
    const [correo, setCorreo] = useState('');
    const [direccion, setDireccion] = useState('');

    // Touched state
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    // Validations
    const validateNombre = (val: string) => val.trim().length > 2;
    const validateRif = (val: string) => /^\d{6,9}$/.test(val);
    const validateEmail = (val: string) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const validateTelefono = (val: string) => val === '' || (/^\d{7}$/.test(val) && telefonoCodigo !== '');

    const isValid =
        validateNombre(nombre) &&
        (rifNum === '' || validateRif(rifNum)) &&
        validateEmail(correo) &&
        validateTelefono(telefonoNum);

    // Initialize/Reset
    useEffect(() => {
        if (isOpen) {
            if (proveedorAEditar) {
                setNombre(proveedorAEditar.nombre);

                if (proveedorAEditar.rif) {
                    // Assuming format J-12345678
                    const parts = proveedorAEditar.rif.split('-');
                    if (parts.length > 1) {
                        setRifNum(parts[1]);
                    } else {
                        setRifNum(proveedorAEditar.rif);
                    }
                } else {
                    setRifNum('');
                }

                if (proveedorAEditar.telefono) {
                    const [code, num] = proveedorAEditar.telefono.split('-');
                    setTelefonoCodigo(code || '');
                    setTelefonoNum(num || '');
                } else {
                    setTelefonoCodigo('');
                    setTelefonoNum('');
                }

                setCorreo(proveedorAEditar.correo || '');
                setDireccion(proveedorAEditar.direccion || '');
            } else {
                setNombre('');
                setRifNum('');
                setTelefonoCodigo('');
                setTelefonoNum('');
                setCorreo('');
                setDireccion('');
            }
            setTouched({});
            setError('');
        }
    }, [isOpen, proveedorAEditar]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        setError('');

        const payload = {
            nombre,
            rif: rifNum ? `J-${rifNum}` : '',
            telefono: (telefonoCodigo && telefonoNum) ? `${telefonoCodigo}-${telefonoNum}` : '',
            correo,
            direccion
        };

        try {
            let result;
            if (proveedorAEditar) {
                result = await actualizarProveedor({
                    id: proveedorAEditar.id,
                    ...payload
                });
            } else {
                result = await crearProveedor(payload);
            }

            if ('error' in result && result.error) {
                setError(result.error);
            } else {
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 relative">
                            <Truck className="w-6 h-6" />
                            {!isEditing && (
                                <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5 border-2 border-white">
                                    <Plus className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                            <p className="text-xs text-slate-500">{isEditing ? 'Modifica los datos del proveedor' : 'Ingresa los datos del proveedor'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Nombre / Razón Social <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            onBlur={() => handleBlur('nombre')}
                            className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.nombre && !validateNombre(nombre)
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                            placeholder="Ej. Distribuidora de Repuestos El Sol"
                        />
                        {touched.nombre && !validateNombre(nombre) && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> El nombre es obligatorio
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        {/* RIF */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">RIF / Documento</label>
                            <div className="flex gap-2">
                                <div className="flex items-center justify-center px-4 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 select-none">
                                    J-
                                </div>
                                <input
                                    type="text"
                                    value={rifNum}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setRifNum(val);
                                    }}
                                    onBlur={() => handleBlur('rif')}
                                    className={`flex-1 px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.rif && rifNum !== '' && !validateRif(rifNum)
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                        }`}
                                    placeholder="12345678"
                                />
                            </div>
                            {touched.rif && rifNum !== '' && !validateRif(rifNum) && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Formato inválido (Mínimo 6 dígitos)
                                </p>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Teléfono</label>
                            <div className="flex gap-2">
                                <div className="relative w-28 flex-shrink-0">
                                    <select
                                        value={telefonoCodigo}
                                        onChange={(e) => setTelefonoCodigo(e.target.value)}
                                        className="w-full h-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Prefijo</option>
                                        {CODIGOS_TELEFONO.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={telefonoNum}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 7) setTelefonoNum(val);
                                    }}
                                    onBlur={() => handleBlur('telefono')}
                                    className={`flex-1 px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.telefono && !validateTelefono(telefonoNum)
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                        }`}
                                    placeholder="1234567"
                                />
                            </div>
                            {touched.telefono && !validateTelefono(telefonoNum) && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Selecciona prefijo y 7 dígitos
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Correo */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Correo Electrónico</label>
                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            onBlur={() => handleBlur('correo')}
                            className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.correo && !validateEmail(correo)
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                            placeholder="contacto@proveedor.com"
                        />
                        {touched.correo && !validateEmail(correo) && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Formato de correo inválido
                            </p>
                        )}
                    </div>

                    {/* Dirección */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Dirección Física</label>
                        <textarea
                            rows={3}
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
                            placeholder="Dirección completa del proveedor..."
                        />
                    </div>

                    {/* Footer Actions inside Form to submit with Enter */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !isValid}
                            className="flex-1 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-blue-500/25 shadow-lg shadow-blue-500/10 transition-all disabled:opacity-50 disabled:grayscale disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <div className="relative">
                                        <Truck className="w-4 h-4" />
                                        {!isEditing && (
                                            <div className="absolute -top-1 -right-1">
                                                <Plus className="w-2 h-2 text-white fill-current stroke-[3]" />
                                            </div>
                                        )}
                                    </div>
                                    {isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
