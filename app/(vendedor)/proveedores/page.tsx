import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ProveedoresClientPage } from '@/components/vendedor/proveedores/ProveedoresClientPage';
import { listarProveedores } from '@/lib/actions-proveedores';

export default async function ProveedoresPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const search = typeof params.search === 'string' ? params.search : '';

    const resultado = await listarProveedores(page, 10, search);

    if ('error' in resultado && resultado.error) {
        return <div className="p-8 text-red-500">Error: {resultado.error}</div>;
    }

    const { proveedores = [], total = 0, totalPages = 0 } = resultado as any;

    return (
        <div className="space-y-6">
            <ProveedoresClientPage
                initialProveedores={proveedores}
                total={total}
                totalPages={totalPages}
                currentPage={page}
            />
        </div>
    );
}
