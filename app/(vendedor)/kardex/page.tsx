import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { obtenerMovimientos } from '@/lib/actions-kardex';
import { KardexClientPage } from '@/components/vendedor/kardex/KardexClientPage';
import { MovimientoTipo } from '@prisma/client';

export default async function KardexPage({
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
    const tipo = typeof params.tipo === 'string' ? params.tipo as MovimientoTipo : undefined;
    const fechaInicio = typeof params.fechaInicio === 'string' ? params.fechaInicio : undefined;
    const fechaFin = typeof params.fechaFin === 'string' ? params.fechaFin : undefined;

    const usuario = await prisma.usuario.findUnique({
        where: { email: session.user.email },
        include: { tienda: true }
    });

    if (!usuario?.tienda) {
        redirect('/login');
    }

    const { movimientos, total, totalPages } = await obtenerMovimientos({
        tiendaId: usuario.tienda.id,
        page,
        limit: 10,
        search,
        tipo,
        fechaInicio,
        fechaFin
    });

    const productos = await prisma.producto.findMany({
        where: { tiendaId: usuario.tienda.id },
        select: { id: true, nombre: true, codigoOEM: true },
        orderBy: { nombre: 'asc' }
    });

    return (
        <div className="space-y-6">
            <KardexClientPage
                movimientosIniciales={movimientos}
                total={total}
                totalPages={totalPages}
                currentPage={page}
                productos={productos}
                tiendaId={usuario.tienda.id}
            />
        </div>
    );
}
