import { redirect } from 'next/navigation';
import { getProductoById, getCategorias, getMarcasVehiculo } from '@/lib/actions-productos';
import { CrearProductoForm } from '@/components/vendedor/productos/CrearProductoForm';

export const dynamic = 'force-dynamic';

interface EditarProductoPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditarProductoPage({ params }: EditarProductoPageProps) {
    const { id } = await params;

    const [producto, categorias, marcas] = await Promise.all([
        getProductoById(id),
        getCategorias(),
        getMarcasVehiculo(),
    ]);

    if (!producto) {
        redirect('/productos');
    }

    return (
        <CrearProductoForm
            categorias={categorias}
            marcas={marcas}
            mode="edit"
            initialData={producto}
        />
    );
}
