import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { OrdenesClientPage } from '@/components/vendedor/ordenes/OrdenesClientPage';
import { obtenerOrdenes } from '@/lib/actions-ordenes';

export default async function OrdenesPage({
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
    const estado = typeof params.estado === 'string' ? params.estado : undefined;
    const fechaSolicitud = typeof params.fechaSolicitud === 'string' ? params.fechaSolicitud : undefined;
    const fechaLlegada = typeof params.fechaLlegada === 'string' ? params.fechaLlegada : undefined;

    const usuario = await prisma.usuario.findUnique({
        where: { email: session.user.email },
        include: { tienda: true }
    });

    if (!usuario?.tienda) {
        redirect('/login');
    }

    const { ordenes, total, totalPages } = await obtenerOrdenes(
        usuario.tienda.id,
        page,
        10,
        search,
        estado,
        fechaSolicitud,
        fechaLlegada
    );

    const proveedores = await prisma.proveedor.findMany({
        where: { tiendaId: usuario.tienda.id, activo: true },
        select: { id: true, nombre: true }
    });

    const productos = await prisma.producto.findMany({
        where: { tiendaId: usuario.tienda.id, disponible: true },
        select: { id: true, nombre: true, codigoOEM: true, precio: true }
    });

    // Transformar Decimal solo para productos (las órdenes ya vienen serializadas de obtenerOrdenes)
    const productosSerializables = productos.map(prod => ({
        ...prod,
        precio: Number(prod.precio)
    }));

    return (
        <div className="space-y-6" >
            <OrdenesClientPage
                ordenesIniciales={ordenes}
                total={total}
                totalPages={totalPages}
                currentPage={page}
                proveedores={proveedores}
                productos={productosSerializables}
                usuarioId={usuario.id}
                tiendaId={usuario.tienda.id}
            />
        </div >
    );
}
