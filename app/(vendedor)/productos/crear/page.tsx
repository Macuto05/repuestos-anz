import { auth } from '@/auth';
import { getCategorias, getMarcasVehiculo } from '@/lib/actions-productos';
import { CrearProductoForm } from '@/components/vendedor/productos/CrearProductoForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CrearProductoPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const [categorias, marcas] = await Promise.all([
        getCategorias(),
        getMarcasVehiculo(),
    ]);

    return (
        <CrearProductoForm
            categorias={categorias}
            marcas={marcas}
        />
    );
}
