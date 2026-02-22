import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user || session.user.rol !== 'admin') {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 403 }
            );
        }

        const { notas } = await request.json();

        const log = await prisma.logSeguridad.update({
            where: { id: params.id },
            data: {
                resuelto: true,
                notas: notas
            }
        });

        return NextResponse.json({ success: true, log });

    } catch (error) {
        console.error('Error al resolver log:', error);
        return NextResponse.json(
            { error: 'Error al resolver log' },
            { status: 500 }
        );
    }
}
