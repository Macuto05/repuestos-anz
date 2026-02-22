# Seguridad Multi-Tenant

## Aislamiento de Datos

Cada tienda (o Vendedor bajo el esquema) solo puede acceder a sus propios datos. Esto evita ataques de acceso horizontal o modificación injertada por red en otros Inquilinos/Tenants de la red global de SaaS. Esto se implementa mediante:

1. **Filtrado manual protegido en queries**: Todas las queries destructivas o constructivas no aceptan injerto externo de `tiendaId` sino que extraen la información del JSON Web Token usando la utilidad `obtenerSesionValidada`.
2. **Middleware de Prisma**: Capa automática adicional que auto-filtra por tienda, sirviendo como última compuerta blindada en el conector PrismaDB.
3. **Validación de permisos**: Utilidades para verificar acceso a recursos específicos cruzadas mediante `verificarAccesoRecurso()`.

## Uso en API Routes o Server Actions
```typescript
import prisma, { runInTiendaContext } from '@/lib/prisma';
import { obtenerSesionValidada } from '@/lib/auth/permissions';

export async function POST(request: Request) {
  const session = await obtenerSesionValidada();
  
  // Contexto guardián asíncrono y seguro para Serverless (AsyncLocalStorage)   
  return await runInTiendaContext(session.user.tiendaId, async () => {
    // A partir de este momento, Prisma filtrará y anexará implícitamente el TiendaId del Auth   
    const venta = await prisma.venta.create({ ... });
    return Response.json(venta);
  });
}
```

## Validar Acceso a Recurso Específico (Actualizar un Proveedor o Ítem)
```typescript
import { verificarAccesoRecurso, obtenerSesionValidada } from '@/lib/auth/permissions';
import { runInTiendaContext } from '@/lib/prisma';

export async function actualizarProveedor(data: ActualizarProveedorDTO) {
    const session = await obtenerSesionValidada();
    const { id, ...updateData } = data;

    // Lanza error 403 / unhandled promise rejection si intentas actualizar un ítem cuya base no comparte tiendaId con el JWT Autorizado
    await verificarAccesoRecurso(id, 'proveedor', session);

    // Proceder con la mutación de forma confirmada dentro del scope
    return await runInTiendaContext(session.user.tiendaId, async () => {
        await prisma.proveedor.update({
            where: { id },
            data: updateData,
        });
    });
}
```

## Casos Especiales

### Rutas Públicas del Marketplace
Las rutas públicas (`/`, `/buscar`, `/producto/[id]`) NO deben usar `runInTiendaContext()` 
porque deben mostrar productos de todas las tiendas.

### Panel de Admin
El admin puede ver datos de todas las tiendas. Sus rutas NO deben usar `runInTiendaContext()`.

### Server Actions de Vendedor
Todos los server actions en `lib/actions-*.ts` DEBEN usar:
1. `obtenerSesionValidada()` para extraer tiendaId del JWT
2. `verificarAccesoRecurso()` antes de modificar/eliminar
3. NUNCA confiar en tiendaId del frontend

## Buenas Prácticas para DTOs (Data Transfer Objects)

### NUNCA incluir tiendaId o usuarioId en DTOs

❌ INCORRECTO:
```typescript
type CrearProductoDTO = {
    tiendaId: string;  // ← MAL: Nunca desde frontend
    nombre: string;
    precio: number;
}
```

✅ CORRECTO:
```typescript
type CrearProductoDTO = {
    // tiendaId se extrae de la sesión automáticamente
    nombre: string;
    precio: number;
}

export async function crearProducto(data: CrearProductoDTO) {
    const session = await obtenerSesionValidada();
    
    return runInTiendaContext(session.user.tiendaId, async () => {
        // tiendaId se inyecta automáticamente por el middleware
        await prisma.producto.create({
            data: {
                nombre: data.nombre,
                precio: data.precio
                // tiendaId: ← NO necesario, el middleware lo agrega
            }
        });
    });
}
```

### Razón:
El tiendaId SIEMPRE debe venir del JWT del servidor (sesión), NUNCA del frontend. 
Si se permite en el DTO, abre una vulnerabilidad crítica de seguridad donde un 
hacker podría modificar el tiendaId en la petición HTTP y acceder a datos de 
otras tiendas.

### Generación de Emails y Passwords para Clientes

Cuando se crea un cliente sin email (registro rápido en punto de venta), usar:
- Email: `generarEmailTemporal(cedula)` → Genera email único con hash
- Password: `generarPasswordNoUsable()` → Genera password aleatorio de 64 caracteres

Estos clientes NO tienen capacidad de login. Si en el futuro se implementa login 
de clientes, deberán cambiar su email y crear un password real.

## Sistema de Logging de Seguridad

### Descripción
El sistema registra automáticamente todos los intentos de acceso no autorizado entre tiendas (ataques inter-tenant). Cada vez que un usuario intenta acceder a un recurso que no le pertenece, se crea un registro en la tabla `LogSeguridad`.

### Qué se registra
- **Quién:** Usuario, email, tienda del atacante
- **Qué:** Recurso objetivo, tipo, tienda dueña
- **Cuándo:** Timestamp exacto
- **Dónde:** URL, método HTTP
- **Cómo:** Acción intentada (UPDATE, DELETE, READ)

### Alertas automáticas
El sistema detecta automáticamente patrones sospechosos:
- **>5 intentos en 10 minutos:** Marca como CRITICAL y registra evento PATRON_SOSPECHOSO
- **Logs futuros:** Implementar envío de email al admin

### Uso en código
```typescript
// Al validar acceso a un recurso
await verificarAccesoRecurso(productoId, 'producto', session, {
    accion: 'UPDATE',
    ruta: '/dashboard/productos/editar',
    metodo: 'POST'
});
// Si el usuario no tiene permiso, se registra automáticamente
```

### APIs disponibles para admin
```typescript
// Obtener logs (paginados)
GET /api/admin/security-logs?page=1&limit=50

// Obtener estadísticas
GET /api/admin/security-stats

// Marcar log como resuelto
POST /api/admin/security-logs/:id/resolve
Body: { notas: "Investigado, fue un error del usuario" }
```

### Consultas útiles
```typescript
// Ver últimos 10 intentos
const logs = await prisma.logSeguridad.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: { usuario: true }
});

// Top usuarios sospechosos
const topAtacantes = await prisma.logSeguridad.groupBy({
    by: ['usuarioId', 'emailUsuario'],
    _count: true,
    orderBy: { _count: { usuarioId: 'desc' } },
    take: 10
});
```

### Mejores prácticas
1. Revisar logs de seguridad semanalmente
2. Investigar todos los eventos CRITICAL
3. Contactar usuarios con múltiples intentos para determinar si es error o malicia
4. Documentar resolución de incidentes en campo `notas`
