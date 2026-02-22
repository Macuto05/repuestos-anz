import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        // Solo admin puede ver logs de seguridad
        if (!session?.user || session.user.rol !== 'admin') {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.logSeguridad.findMany({
                include: {
                    usuario: {
                        select: {
                            nombre: true,
                            email: true,
                            tienda: {
                                select: {
                                    nombre: true
                                }
                            }
                        }
                    }
                },
                orderBy: { timestamp: 'desc' },
                skip,
                take: limit
            }),

            prisma.logSeguridad.count()
        ]);

        return NextResponse.json({
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Error al obtener logs:', error);
        return NextResponse.json(
            { error: 'Error al obtener logs' },
            { status: 500 }
        );
    }
}
