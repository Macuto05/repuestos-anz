import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SecurityLoggerService } from '@/lib/services/SecurityLoggerService';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user || session.user.rol !== 'admin') {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 403 }
            );
        }

        const stats = await SecurityLoggerService.obtenerEstadisticas(7);

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return NextResponse.json(
            { error: 'Error al obtener estadísticas' },
            { status: 500 }
        );
    }
}
