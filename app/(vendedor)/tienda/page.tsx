import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { MiTiendaClientPage } from '@/components/vendedor/tienda/MiTiendaClientPage';

export default async function MiTiendaPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const tienda = await prisma.tienda.findUnique({
        where: { usuarioId: session.user.id },
    });

    // Serialize for client component
    const serialized = tienda
        ? {
            id: tienda.id,
            nombre: tienda.nombre,
            telefono: tienda.telefono,
            whatsapp: tienda.whatsapp,
            ciudad: tienda.ciudad,
            estado: tienda.estado,
            direccion: tienda.direccion,
            googleMapsUrl: tienda.googleMapsUrl,
            horario: tienda.horario,
            activa: tienda.activa,
            createdAt: tienda.createdAt.toISOString(),
        }
        : null;

    return (
        <div className="space-y-6">
            <MiTiendaClientPage tienda={serialized} />
        </div>
    );
}
