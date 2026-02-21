import { auth } from '@/auth';
import { getProductos, getCategorias } from '@/lib/actions-productos';
import { MisProductosClientPage } from '@/components/vendedor/productos/MisProductosClientPage';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function MisProductosPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const search = typeof params.search === 'string' ? params.search : '';
    const categoriaId = typeof params.categoria === 'string' ? params.categoria : '';
    const estado = typeof params.estado === 'string' ? params.estado : 'todos';

    const [productosData, categorias] = await Promise.all([
        getProductos(page, 10, search, categoriaId, estado),
        getCategorias(),
    ]);

    if (productosData.error) {
        return <div className="p-8 text-red-500">Error: {productosData.error}</div>;
    }

    return (
        <div className="space-y-6">
            <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando productos...</div>}>
                <MisProductosClientPage
                    initialProductos={productosData.productos ?? []}
                    total={productosData.total ?? 0}
                    totalPages={productosData.totalPages ?? 0}
                    itemsPerPage={10}
                    stats={productosData.stats ?? { total: 0, inStock: 0, lowStock: 0 }}
                    categorias={categorias}
                />
            </Suspense>
        </div>
    );
}
