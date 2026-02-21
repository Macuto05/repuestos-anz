export default function RegistroPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Registra tu tienda
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        ¿Ya tienes cuenta?{" "}
                        <a href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                            Inicia sesión aquí
                        </a>
                    </p>
                </div>
                <div className="mt-8 space-y-6">
                    <p className="text-center text-gray-500">Formulario de registro...</p>
                </div>
            </div>
        </div>
    )
}
