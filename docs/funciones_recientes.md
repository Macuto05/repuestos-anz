# Resumen de Nuevas Funciones en Base de Datos

Recientemente incorporamos tres módulos principales para la gestión avanzada de inventario:

## 1. Órdenes de Compra (`OrdenCompra` y `OrdenCompraDetalle`)
Permite gestionar el abastecimiento de productos desde los proveedores.
*   **Funcionalidad:** Registrar pedidos a proveedores.
*   **Estados:** `PENDIENTE` (borrador), `RECIBIDA` (stock entra), `CANCELADA`.
*   **Datos:** Proveedor, fecha solicitud, total estimado y lista de productos solicitados vs. recibidos.

## 2. Ajustes de Inventario (`AjusteInventario` y `DetalleAjuste`)
Permite corregir el stock manualmente sin necesidad de una compra o venta.
*   **Funcionalidad:** Registrar entradas o salidas manuales.
*   **Usos:** Roturas, pérdidas, regalos, conteos de inventario, correcciones.
*   **Datos:** Motivo, observaciones, fecha y lista de productos con cantidad y tipo de movimiento (`ENTRADA`/`SALIDA`).

## 3. Kardex / Movimientos (`MovimientoInventario` y `MovimientoDetalle`)
Es el historial centralizado de *todos* los cambios en el inventario.
*   **Funcionalidad:** Auditoría y trazabilidad del stock.
*   **Datos:**
    *   **Tipo:** Qué causó el movimiento (Compra, Ajuste, Venta, Traslado).
    *   **Referencia:** ID del documento origen (Orden de Compra #123, Ajuste #45).
    *   **Stock Resultante:** Cuánto stock quedó *después* de este movimiento (crucial para reconstruir el historial).

---
**Siguiente Paso Sugerido:**
Implementar el módulo de **Ajustes de Inventario** (Frontend y Backend) para permitir realizar estas correcciones manuales.
