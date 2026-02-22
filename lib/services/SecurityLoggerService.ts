import prisma from '@/lib/prisma';
import { EventoSeguridad, SeveridadEvento } from '@prisma/client';

export type LogSecurityIncidentParams = {
    // Usuario atacante
    usuarioId: string;
    emailUsuario: string;
    tiendaPropiaId: string;

    // Recurso objetivo
    recursoTipo: string;
    recursoId: string;
    tiendaObjetivoId: string;

    // Contexto
    accion: string;
    ruta?: string;
    metodo?: string;

    // Opcional
    detalles?: Record<string, any>;
    severidad?: SeveridadEvento;
};

export class SecurityLoggerService {
    /**
     * Registra un intento de acceso no autorizado
     */
    static async logAccesoNoAutorizado(params: LogSecurityIncidentParams) {
        try {
            await prisma.logSeguridad.create({
                data: {
                    evento: EventoSeguridad.ACCESO_NO_AUTORIZADO,
                    severidad: params.severidad || SeveridadEvento.WARNING,

                    usuarioId: params.usuarioId,
                    emailUsuario: params.emailUsuario,
                    tiendaPropiaId: params.tiendaPropiaId,

                    recursoTipo: params.recursoTipo,
                    recursoId: params.recursoId,
                    tiendaObjetivoId: params.tiendaObjetivoId,

                    accion: params.accion,
                    ruta: params.ruta,
                    metodo: params.metodo,

                    detalles: params.detalles || {},
                }
            });

            // Log en consola para desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.warn('🚨 INTENTO DE ACCESO NO AUTORIZADO:', {
                    usuario: params.emailUsuario,
                    tiendaPropia: params.tiendaPropiaId,
                    intentoAcceder: `${params.recursoTipo}:${params.recursoId}`,
                    tiendaObjetivo: params.tiendaObjetivoId
                });
            }

            // Verificar si hay múltiples intentos del mismo usuario
            await this.verificarPatronSospechoso(params.usuarioId);

        } catch (error) {
            // No lanzar error para no interrumpir el flujo principal
            console.error('Error al registrar log de seguridad:', error);
        }
    }

    /**
     * Verifica si un usuario tiene múltiples intentos recientes (patrón sospechoso)
     */
    private static async verificarPatronSospechoso(usuarioId: string) {
        const hace10Minutos = new Date(Date.now() - 10 * 60 * 1000);

        const intentosRecientes = await prisma.logSeguridad.count({
            where: {
                usuarioId,
                timestamp: { gte: hace10Minutos },
                evento: EventoSeguridad.ACCESO_NO_AUTORIZADO
            }
        });

        // Si tiene más de 5 intentos en 10 minutos, marcar como patrón sospechoso
        if (intentosRecientes >= 5) {
            await prisma.logSeguridad.create({
                data: {
                    evento: EventoSeguridad.PATRON_SOSPECHOSO,
                    severidad: SeveridadEvento.CRITICAL,
                    usuarioId,
                    emailUsuario: '',  // Se llenará desde el contexto
                    tiendaPropiaId: '',
                    recursoTipo: 'MULTIPLE',
                    recursoId: 'MULTIPLE',
                    tiendaObjetivoId: 'MULTIPLE',
                    accion: 'MULTIPLE_ATTEMPTS',
                    detalles: {
                        intentosEnUltimos10Min: intentosRecientes,
                        mensaje: 'Usuario con múltiples intentos de acceso no autorizado'
                    }
                }
            });

            console.error('🚨🚨🚨 ALERTA CRÍTICA: Patrón sospechoso detectado', {
                usuarioId,
                intentos: intentosRecientes
            });

            // TODO: Enviar email al admin (implementar después)
            // await enviarEmailAlertaCritica(usuarioId, intentosRecientes);
        }
    }

    /**
     * Obtiene estadísticas de intentos no autorizados
     */
    static async obtenerEstadisticas(dias: number = 7) {
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - dias);

        const [total, porUsuario, porRecurso, criticos] = await Promise.all([
            // Total de intentos
            prisma.logSeguridad.count({
                where: {
                    timestamp: { gte: fechaInicio },
                    evento: EventoSeguridad.ACCESO_NO_AUTORIZADO
                }
            }),

            // Intentos por usuario (top 10)
            prisma.logSeguridad.groupBy({
                by: ['usuarioId', 'emailUsuario'],
                where: {
                    timestamp: { gte: fechaInicio },
                    evento: EventoSeguridad.ACCESO_NO_AUTORIZADO
                },
                _count: true,
                orderBy: { _count: { usuarioId: 'desc' } },
                take: 10
            }),

            // Recursos más atacados
            prisma.logSeguridad.groupBy({
                by: ['recursoTipo'],
                where: {
                    timestamp: { gte: fechaInicio },
                    evento: EventoSeguridad.ACCESO_NO_AUTORIZADO
                },
                _count: true,
                orderBy: { _count: { recursoTipo: 'desc' } }
            }),

            // Eventos críticos sin resolver
            prisma.logSeguridad.count({
                where: {
                    timestamp: { gte: fechaInicio },
                    severidad: SeveridadEvento.CRITICAL,
                    resuelto: false
                }
            })
        ]);

        return {
            totalIntentos: total,
            usuariosSospechosos: porUsuario,
            recursosMasAtacados: porRecurso,
            eventosCriticosSinResolver: criticos
        };
    }
}
