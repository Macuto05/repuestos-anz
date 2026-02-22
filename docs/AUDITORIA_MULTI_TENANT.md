AUDITORÍA DE AISLAMIENTO DE DATOS

ARCHIVOS ANALIZADOS: 11
(Principalmente sobre lib/actions-*.ts que funcionan como endpoints lógicos mediante Server Actions de React).

PROBLEMAS CRÍTICOS ENCONTRADOS: 6

Archivo: lib/actions-ventas.ts 
Línea: 39 
Problema: Modificación a base de datos usando Payload injertado por cliente (DTO data.tiendaId) sin Auth Matcher.
Severidad: CRÍTICA 
Riesgo: Tienda A puede registrar ventas o mermar stock falseando el ID de Tienda B interceptando la petición HTTPS.
Código actual: 
```typescript
const venta = await tx.venta.create({ data: { tiendaId: data.tiendaId } })
```
Código sugerido: 
```typescript
const session = await auth();
if (data.tiendaId !== session.user.tiendaId) throw new Error('No Autorizado');
```

Archivo: lib/actions-ventas.ts 
Línea: 150 
Problema: Creación de clientes (obtenerOCrearPerfilCliente) delegando el tiendaId directamente desde input y sin validación.
Severidad: CRÍTICA 
Riesgo: Falsificación del Tenant para robar métricas de clientes de otras tiendas.
Código actual: 
```typescript
tiendaId: data.tiendaId
```
Código sugerido: 
```typescript
const session = await auth(); 
// usar session.user.id para deducir tiendaId verdadera
```

Archivo: lib/actions-ajustes.ts 
Línea: 25 
Problema: Server action "crearAjuste" acepta `tiendaId` del front-end ciegamente en base al form payload (`formData.get('tiendaId')`).
Severidad: CRÍTICA 
Riesgo: Tienda A puede dar de baja stock en la Tienda B.

Archivo: lib/actions-kardex.ts 
Línea: 20 
Problema: `getMovimientosInventario` recibe `tiendaId` como argumento de función sin chequear al inicio del pipeline que el usuario es quien dice ser.
Severidad: MEDIA 
Riesgo: Lectura de métricas financieras de la competencia si se adivina el ID UUID.

Archivo: lib/actions-ordenes.ts 
Línea: 30 
Problema: `crearOrdenCompra` acepta `tiendaId` inseguro mediante `formData`.
Severidad: CRÍTICA 
Riesgo: Modificación y escritura inter-tenant no autorizada de pagos a caja.

Archivo: lib/actions-proveedores.ts 
Línea: 45 
Problema: `updateProveedor` usa ID por URL parámetro y omite el check de tenencia `proveedor.tiendaId !== auth().user.tienda.id`.
Severidad: CRÍTICA 
Riesgo: Tienda puede editar, borrar y dañar la información de proveedores de todas las sedes.

PROBLEMAS MENORES ENCONTRADOS: 2
- lib/actions-productos.ts: Expone `getCategorias()` a todo el mundo (Aceptable si las categorías son universales, pero idealmente se devuelven solo las pertinentes).
- lib/actions-busqueda.ts: Realiza `findFirst` con rawQuery vulnerable a la mezcla de IDs temporales.

ARCHIVOS SEGUROS: 3
- lib/actions-productos.ts (Mutaciones fuertemente custodiadas por sesión)
- lib/actions-tienda.ts (Propia actualización protegida por `where: usuarioId: session.id`)
- lib/actions-vendedores.ts (Lógica global del Super Admin)

RESUMEN:
•	APIs con problemas críticos: 5
•	APIs con problemas menores: 2
•	APIs seguras: 3
•	Nivel de riesgo general: CRÍTICO
