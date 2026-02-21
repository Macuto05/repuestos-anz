'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, Eye, EyeOff, Check, AlertCircle, Save } from 'lucide-react';
import { createVendedor, updateVendedor } from '@/lib/actions-vendedores';

const CODIGOS_TELEFONO = [
    '0412',
    '0422',
    '0414',
    '0424',
    '0416',
    '0426',
];

const TIPOS_CEDULA = ['V', 'E'];

interface CreateVendedorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    vendedorToEdit?: {
        id: string;
        nombre: string;
        email: string;
        cedula?: string | null;
        telefono?: string | null;
    } | null;
}

// Password requirement checker
const REQUIREMENTS = [
    { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
    { label: 'Una mayúscula', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Una minúscula', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Un número', test: (p: string) => /[0-9]/.test(p) },
    { label: 'Un carácter especial', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function CreateVendedorModal({ isOpen, onClose, onSuccess, vendedorToEdit }: CreateVendedorModalProps) {
    const isEditing = !!vendedorToEdit;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [nombre, setNombre] = useState('');
    const [cedulaType, setCedulaType] = useState('V');
    const [cedulaNum, setCedulaNum] = useState('');
    const [email, setEmail] = useState('');
    const [telefonoCodigo, setTelefonoCodigo] = useState('');
    const [telefonoNum, setTelefonoNum] = useState('');
    const [password, setPassword] = useState('');

    // Touched state for validation visualization
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    // Validation Functions
    const validateNombre = (val: string) => /^[a-zA-Z0-9\sñÑáéíóúÁÉÍÓÚ]+$/.test(val) && val.length > 0;
    const validateCedula = (val: string) => /^\d{6,8}$/.test(val);
    const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const validateTelefonoRequired = (val: string) => /^\d{7}$/.test(val) && telefonoCodigo !== '';

    const metRequirements = REQUIREMENTS.filter(req => req.test(password));
    const passwordStrength = (metRequirements.length / REQUIREMENTS.length) * 100;
    const isPasswordValid = isEditing ? (password === '' || metRequirements.length === REQUIREMENTS.length) : metRequirements.length === REQUIREMENTS.length;

    // "Todos los campos deben estar rellenados" (Password optional in edit)
    const isValid =
        validateNombre(nombre) &&
        validateCedula(cedulaNum) &&
        validateEmail(email) &&
        telefonoCodigo !== '' &&
        /^\d{7}$/.test(telefonoNum) &&
        isPasswordValid;

    // Reset state on close/open
    useEffect(() => {
        if (isOpen) {
            if (vendedorToEdit) {
                setNombre(vendedorToEdit.nombre);
                setEmail(vendedorToEdit.email);

                if (vendedorToEdit.cedula) {
                    const [type, num] = vendedorToEdit.cedula.split('-');
                    setCedulaType(type || 'V');
                    setCedulaNum(num || '');
                } else {
                    setCedulaType('V');
                    setCedulaNum('');
                }

                if (vendedorToEdit.telefono) {
                    const [code, num] = vendedorToEdit.telefono.split('-');
                    setTelefonoCodigo(code || '');
                    setTelefonoNum(num || '');
                } else {
                    setTelefonoCodigo('');
                    setTelefonoNum('');
                }
            } else { // Reset for creation
                setNombre('');
                setCedulaType('V');
                setCedulaNum('');
                setEmail('');
                setTelefonoCodigo('');
                setTelefonoNum('');
            }
            setPassword('');
            setTouched({});
            setError('');
        }
    }, [isOpen, vendedorToEdit]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid) return;

        setIsLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('cedula', `${cedulaType}-${cedulaNum}`);
        formData.append('email', email);
        formData.append('telefono_codigo', telefonoCodigo);
        formData.append('telefono_numero', telefonoNum);

        if (password) {
            formData.append('password', password);
        }

        let result;
        if (isEditing && vendedorToEdit) {
            formData.append('id', vendedorToEdit.id);
            result = await updateVendedor(formData);
        } else {
            // Password is mandatory for creation, handled by isValid check but good to ensure
            if (!password) {
                setError('La contraseña es obligatoria para nuevos usuarios.');
                setIsLoading(false);
                return;
            }
            formData.append('password', password); // Already appended above if truthy, but standardizing
            result = await createVendedor(formData);
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
                            {isEditing ? <Save className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Editar Vendedor' : 'Nuevo Vendedor'}</h2>
                            <p className="text-xs text-slate-500">{isEditing ? 'Modifica los datos del vendedor' : 'Ingresa los datos del vendedor'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Scrollable Area */}
                <div className="overflow-y-auto p-6 space-y-5">

                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Nombre completo</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^[a-zA-Z0-9\sñÑáéíóúÁÉÍÓÚ]*$/.test(val)) setNombre(val);
                            }}
                            onBlur={() => handleBlur('nombre')}
                            placeholder="Ej: Juan Pérez"
                            className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.nombre && !validateNombre(nombre)
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                        />
                        {touched.nombre && !validateNombre(nombre) && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Solo letras y números, sin símbolos
                            </p>
                        )}
                    </div>

                    {/* Cédula */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Número de Cédula</label>
                        <div className="flex gap-2">
                            <div className="relative w-24">
                                <select
                                    value={cedulaType}
                                    onChange={(e) => setCedulaType(e.target.value)}
                                    className="w-full h-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none cursor-pointer"
                                >
                                    {TIPOS_CEDULA.map(t => <option key={t} value={t}>{t}-</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={cedulaNum}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 8) setCedulaNum(val);
                                }}
                                onBlur={() => handleBlur('cedula')}
                                placeholder="12345678"
                                className={`flex-1 px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.cedula && !validateCedula(cedulaNum)
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                    }`}
                            />
                        </div>
                        {touched.cedula && !validateCedula(cedulaNum) && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Debe tener entre 6 y 8 números
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Correo electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => handleBlur('email')}
                            placeholder="vendedor@empresa.com"
                            className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.email && !validateEmail(email)
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                        />
                        {touched.email && !validateEmail(email) && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Formato de correo inválido
                            </p>
                        )}
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Teléfono móvil</label>
                        <div className="flex gap-2">
                            <div className="relative w-28">
                                <select
                                    value={telefonoCodigo}
                                    onChange={(e) => setTelefonoCodigo(e.target.value)}
                                    className="w-full h-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="">Prefijo</option>
                                    {CODIGOS_TELEFONO.map(code => <option key={code} value={code}>{code}</option>)}
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
                                placeholder="1234567"
                                className={`flex-1 px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none ${touched.telefono && !validateTelefonoRequired(telefonoNum)
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                                    }`}
                            />
                        </div>
                        {touched.telefono && !validateTelefonoRequired(telefonoNum) && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Selecciona prefijo y 7 números exactos
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Contraseña {isEditing && <span className="text-slate-400 font-normal">(Opcional)</span>}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isEditing ? "Dejar en blanco para mantener" : "••••••••"}
                                    className="block w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Strength Meter - Only show if password fields has content or creating new */}
                        {(password.length > 0) && (
                            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex gap-1 h-1.5 mb-2">
                                    <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 20 ? 'bg-red-500' : 'bg-slate-200'}`} />
                                    <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 40 ? 'bg-orange-500' : 'bg-slate-200'}`} />
                                    <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 60 ? 'bg-yellow-500' : 'bg-slate-200'}`} />
                                    <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 80 ? 'bg-lime-500' : 'bg-slate-200'}`} />
                                    <div className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength === 100 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    {REQUIREMENTS.map((req, i) => (
                                        <div key={i} className={`flex items-center gap-1.5 text-xs ${req.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${req.test(password) ? 'bg-emerald-100 border-emerald-500' : 'bg-transparent border-slate-300'}`}>
                                                {req.test(password) && <Check className="w-2 h-2 text-emerald-600" />}
                                            </div>
                                            {req.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
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
                                {isEditing ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                {isEditing ? 'Guardar Cambios' : 'Crear Vendedor'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
