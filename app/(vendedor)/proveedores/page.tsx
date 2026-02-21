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

    const { proveedores = [], total = 0, totalPages = 0, error } = await listarProveedores(page, 10, search);

    if (error) {
        return <div className="p-8 text-red-500">Error: {error}</div>;
    }

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
