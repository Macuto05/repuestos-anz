-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('admin', 'vendedor');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('PENDIENTE', 'CANCELADA', 'RECIBIDA', 'PARCIAL');

-- CreateEnum
CREATE TYPE "MotivoAjuste" AS ENUM ('ROTURA', 'PERDIDA', 'SOBRANTE', 'CONSUMO_INTERNO', 'DIF_CONTEO', 'DEVOLUCION', 'ERROR');

-- CreateEnum
CREATE TYPE "MovimientoTipo" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'PAGO_MOVIL', 'PUNTO', 'ZELLE', 'MIXTO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cedula" TEXT,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'vendedor',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tienda" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "whatsapp" TEXT,
    "ciudad" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "googleMapsUrl" TEXT,
    "horario" JSONB,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarcaVehiculo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MarcaVehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloVehiculo" (
    "id" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ModeloVehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigoOEM" TEXT,
    "descripcion" TEXT,
    "categoriaId" TEXT NOT NULL,
    "marcaRepuesto" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 5,
    "imagenes" TEXT[],
    "imagenPrincipal" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compatibilidad" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "modeloId" TEXT,
    "anoInicio" INTEGER,
    "anoFin" INTEGER,
    "motor" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Compatibilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rif" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenCompra" (
    "id" TEXT NOT NULL,
    "consecutivo" SERIAL NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'PENDIENTE',
    "totalEstimado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaLlegada" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenCompraDetalle" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidadSolicitada" INTEGER NOT NULL,
    "cantidadRecibida" INTEGER NOT NULL DEFAULT 0,
    "costoUnitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrdenCompraDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjusteInventario" (
    "id" TEXT NOT NULL,
    "consecutivo" SERIAL NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" "MotivoAjuste",
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AjusteInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleAjuste" (
    "id" TEXT NOT NULL,
    "ajusteId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "tipo" "MovimientoTipo" NOT NULL,

    CONSTRAINT "DetalleAjuste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "MovimientoTipo" NOT NULL,
    "referencia" TEXT,
    "observaciones" TEXT,
    "ordenCompraId" TEXT,
    "ajusteId" TEXT,
    "ventaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoDetalle" (
    "id" TEXT NOT NULL,
    "movimientoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stockResultante" INTEGER NOT NULL,

    CONSTRAINT "MovimientoDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "consecutivo" SERIAL NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "clienteId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "total" DECIMAL(10,2) NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleVenta" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "DetalleVenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cedula_key" ON "Usuario"("cedula");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tienda_usuarioId_key" ON "Tienda"("usuarioId");

-- CreateIndex
CREATE INDEX "Tienda_ciudad_activa_idx" ON "Tienda"("ciudad", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_slug_key" ON "Categoria"("slug");

-- CreateIndex
CREATE INDEX "Categoria_activa_orden_idx" ON "Categoria"("activa", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "MarcaVehiculo_nombre_key" ON "MarcaVehiculo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MarcaVehiculo_slug_key" ON "MarcaVehiculo"("slug");

-- CreateIndex
CREATE INDEX "MarcaVehiculo_activa_idx" ON "MarcaVehiculo"("activa");

-- CreateIndex
CREATE INDEX "ModeloVehiculo_marcaId_activa_idx" ON "ModeloVehiculo"("marcaId", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "ModeloVehiculo_marcaId_slug_key" ON "ModeloVehiculo"("marcaId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigoOEM_key" ON "Producto"("codigoOEM");

-- CreateIndex
CREATE INDEX "Producto_categoriaId_disponible_idx" ON "Producto"("categoriaId", "disponible");

-- CreateIndex
CREATE INDEX "Producto_tiendaId_stock_idx" ON "Producto"("tiendaId", "stock");

-- CreateIndex
CREATE INDEX "Producto_nombre_marcaRepuesto_idx" ON "Producto"("nombre", "marcaRepuesto");

-- CreateIndex
CREATE INDEX "Compatibilidad_marcaId_modeloId_idx" ON "Compatibilidad"("marcaId", "modeloId");

-- CreateIndex
CREATE INDEX "Compatibilidad_productoId_idx" ON "Compatibilidad"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "Compatibilidad_productoId_marcaId_modeloId_anoInicio_key" ON "Compatibilidad"("productoId", "marcaId", "modeloId", "anoInicio");

-- CreateIndex
CREATE INDEX "Proveedor_tiendaId_activo_idx" ON "Proveedor"("tiendaId", "activo");

-- CreateIndex
CREATE INDEX "Proveedor_nombre_idx" ON "Proveedor"("nombre");

-- CreateIndex
CREATE INDEX "OrdenCompra_proveedorId_idx" ON "OrdenCompra"("proveedorId");

-- CreateIndex
CREATE INDEX "OrdenCompra_estado_idx" ON "OrdenCompra"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenCompra_tiendaId_consecutivo_key" ON "OrdenCompra"("tiendaId", "consecutivo");

-- CreateIndex
CREATE INDEX "OrdenCompraDetalle_ordenId_idx" ON "OrdenCompraDetalle"("ordenId");

-- CreateIndex
CREATE INDEX "OrdenCompraDetalle_productoId_idx" ON "OrdenCompraDetalle"("productoId");

-- CreateIndex
CREATE INDEX "AjusteInventario_fecha_idx" ON "AjusteInventario"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "AjusteInventario_tiendaId_consecutivo_key" ON "AjusteInventario"("tiendaId", "consecutivo");

-- CreateIndex
CREATE INDEX "DetalleAjuste_ajusteId_idx" ON "DetalleAjuste"("ajusteId");

-- CreateIndex
CREATE INDEX "DetalleAjuste_productoId_idx" ON "DetalleAjuste"("productoId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_fecha_idx" ON "MovimientoInventario"("fecha");

-- CreateIndex
CREATE INDEX "MovimientoInventario_ordenCompraId_idx" ON "MovimientoInventario"("ordenCompraId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_ajusteId_idx" ON "MovimientoInventario"("ajusteId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_tipo_idx" ON "MovimientoInventario"("tipo");

-- CreateIndex
CREATE INDEX "MovimientoDetalle_movimientoId_idx" ON "MovimientoDetalle"("movimientoId");

-- CreateIndex
CREATE INDEX "MovimientoDetalle_productoId_idx" ON "MovimientoDetalle"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_usuarioId_key" ON "Cliente"("usuarioId");

-- CreateIndex
CREATE INDEX "Cliente_nombre_apellido_idx" ON "Cliente"("nombre", "apellido");

-- CreateIndex
CREATE INDEX "Cliente_telefono_idx" ON "Cliente"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_tiendaId_cedula_key" ON "Cliente"("tiendaId", "cedula");

-- CreateIndex
CREATE INDEX "Venta_fecha_idx" ON "Venta"("fecha");

-- CreateIndex
CREATE INDEX "Venta_clienteId_idx" ON "Venta"("clienteId");

-- CreateIndex
CREATE INDEX "Venta_usuarioId_idx" ON "Venta"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_tiendaId_consecutivo_key" ON "Venta"("tiendaId", "consecutivo");

-- CreateIndex
CREATE INDEX "DetalleVenta_ventaId_idx" ON "DetalleVenta"("ventaId");

-- CreateIndex
CREATE INDEX "DetalleVenta_productoId_idx" ON "DetalleVenta"("productoId");

-- AddForeignKey
ALTER TABLE "Tienda" ADD CONSTRAINT "Tienda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloVehiculo" ADD CONSTRAINT "ModeloVehiculo_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "MarcaVehiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compatibilidad" ADD CONSTRAINT "Compatibilidad_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compatibilidad" ADD CONSTRAINT "Compatibilidad_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "MarcaVehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compatibilidad" ADD CONSTRAINT "Compatibilidad_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloVehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompra" ADD CONSTRAINT "OrdenCompra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompraDetalle" ADD CONSTRAINT "OrdenCompraDetalle_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenCompraDetalle" ADD CONSTRAINT "OrdenCompraDetalle_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteInventario" ADD CONSTRAINT "AjusteInventario_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteInventario" ADD CONSTRAINT "AjusteInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleAjuste" ADD CONSTRAINT "DetalleAjuste_ajusteId_fkey" FOREIGN KEY ("ajusteId") REFERENCES "AjusteInventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleAjuste" ADD CONSTRAINT "DetalleAjuste_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "OrdenCompra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_ajusteId_fkey" FOREIGN KEY ("ajusteId") REFERENCES "AjusteInventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoDetalle" ADD CONSTRAINT "MovimientoDetalle_movimientoId_fkey" FOREIGN KEY ("movimientoId") REFERENCES "MovimientoInventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoDetalle" ADD CONSTRAINT "MovimientoDetalle_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Custom Constraint: Exactamente un documento origen para movimientos
ALTER TABLE "MovimientoInventario" 
ADD CONSTRAINT "exactamente_un_documento_origen" 
CHECK (
  (CASE WHEN "ordenCompraId" IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "ajusteId" IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "ventaId" IS NOT NULL THEN 1 ELSE 0 END) = 1
);
