import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AjustesClientPage } from '@/components/vendedor/ajustes/AjustesClientPage';
import { obtenerAjustes } from '@/lib/actions-ajustes';

export default async function AjustesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/login');
    }

    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const search = typeof params.search === 'string' ? params.search : '';
    const motivo = typeof params.motivo === 'string' ? params.motivo as any : undefined;
    const tipo = typeof params.tipo === 'string' ? params.tipo as any : undefined;
    const fechaInicio = typeof params.fechaInicio === 'string' ? params.fechaInicio : undefined;
    const fechaFin = typeof params.fechaFin === 'string' ? params.fechaFin : undefined;

    const usuario = await prisma.usuario.findUnique({
        where: { email: session.user.email },
        include: { tienda: true }
    });

    if (!usuario?.tienda) {
        redirect('/login');
    }

    const { ajustes, total, totalPages } = await obtenerAjustes(
        usuario.tienda.id,
        page,
        10,
        search,
        motivo,
        tipo,
        fechaInicio,
        fechaFin
    );

    const productos = await prisma.producto.findMany({
        where: { tiendaId: usuario.tienda.id, disponible: true },
        select: { id: true, nombre: true, codigoOEM: true, stock: true }
    });

    return (
        <div className="space-y-6">
            <AjustesClientPage
                ajustesIniciales={ajustes}
                total={total}
                totalPages={totalPages}
                currentPage={page}
                productosDisponibles={productos}
                usuarioId={usuario.id}
                tiendaId={usuario.tienda.id}
            />
        </div>
    );
}
