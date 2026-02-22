import { auth } from "@/auth"; // Asegúrate de que esto apunte a tu configuración de Auth
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import POSClientPage from "@/components/vendedor/ventas/POSClientPage";

export default async function POSPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login");
    }

    const usuario = await prisma.usuario.findUnique({
        where: { email: session.user.email },
        include: { tienda: true }
    });

    if (!usuario) {
        redirect("/login");
    }

    // Si el usuario es vendedor, debería tener una tienda asignada o estar vinculado a una
    // En tu esquema actual: Usuario -> Tienda (1:1 opcional) O Tienda -> Usuario (1:1)
    // Revisa tu esquema: Usuario tiene `tienda` si es dueño/admin, pero si es vendedor simple ¿cómo se vincula?
    // Asumiremos por ahora que el usuario tiene acceso a la tienda vinculada a su cuenta.

    // CORRECCIÓN RAPIDA: En tu esquema actual `Usuario` tiene `tienda Tienda?`.
    // Si es un vendedor empleado, ¿dónde está el `tiendaId` en Usuario?
    // Veo `model Tienda { usuarioId String @unique ... }`. Esto significa que UN usuario es DUEÑO de UNA tienda.
    // Faltaría un campo `tiendaId` en `Usuario` para saber a qué tienda pertenece un empleado.
    // POR AHORA: Usaremos el ID de la tienda del usuario dueño/admin para probar.

    const tienda = await prisma.tienda.findUnique({
        where: { usuarioId: usuario.id }
    });

    if (!tienda) {
        return <div>Error: No tienes una tienda asignada. Contacta al administrador.</div>;
    }

    return (
        <div className="space-y-6">
            <POSClientPage />
        </div>
    );
}
