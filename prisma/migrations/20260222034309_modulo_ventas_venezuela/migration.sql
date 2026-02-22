/*
  Warnings:

  - The values [EFECTIVO,ZELLE] on the enum `MetodoPago` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `clienteId` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `totalUSD` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MetodoPago_new" AS ENUM ('EFECTIVO_BS', 'PAGO_MOVIL', 'TRANSFERENCIA', 'PUNTO', 'DIVISA', 'MIXTO');
ALTER TABLE "public"."Venta" ALTER COLUMN "metodoPago" DROP DEFAULT;
ALTER TABLE "Venta" ALTER COLUMN "metodoPago" TYPE "MetodoPago_new" USING ("metodoPago"::text::"MetodoPago_new");
ALTER TABLE "PagoVenta" ALTER COLUMN "metodoPago" TYPE "MetodoPago_new" USING ("metodoPago"::text::"MetodoPago_new");
ALTER TYPE "MetodoPago" RENAME TO "MetodoPago_old";
ALTER TYPE "MetodoPago_new" RENAME TO "MetodoPago";
DROP TYPE "public"."MetodoPago_old";
ALTER TABLE "Venta" ALTER COLUMN "metodoPago" SET DEFAULT 'EFECTIVO_BS';
COMMIT;

-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'cliente';

-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_tiendaId_fkey";

-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_clienteId_fkey";

-- DropIndex
DROP INDEX "Producto_codigoOEM_key";

-- DropIndex
DROP INDEX "Venta_clienteId_idx";

-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "clienteId",
DROP COLUMN "total",
ADD COLUMN     "perfilClienteId" TEXT,
ADD COLUMN     "tasaDolar" DECIMAL(10,2),
ADD COLUMN     "totalBs" DECIMAL(12,2),
ADD COLUMN     "totalUSD" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "metodoPago" SET DEFAULT 'EFECTIVO_BS';

-- DropTable
DROP TABLE "Cliente";

-- CreateTable
CREATE TABLE "PerfilCliente" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "notas" TEXT,
    "descuentoPersonalizado" DECIMAL(5,2),
    "primeraCompra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaCompra" TIMESTAMP(3),
    "totalCompras" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoVenta" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "montoUSD" DECIMAL(10,2) NOT NULL,
    "montoBs" DECIMAL(12,2),
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoVenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerfilCliente_tiendaId_idx" ON "PerfilCliente"("tiendaId");

-- CreateIndex
CREATE INDEX "PerfilCliente_usuarioId_idx" ON "PerfilCliente"("usuarioId");

-- CreateIndex
CREATE INDEX "PerfilCliente_tiendaId_totalCompras_idx" ON "PerfilCliente"("tiendaId", "totalCompras" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PerfilCliente_usuarioId_tiendaId_key" ON "PerfilCliente"("usuarioId", "tiendaId");

-- CreateIndex
CREATE INDEX "PagoVenta_ventaId_idx" ON "PagoVenta"("ventaId");

-- CreateIndex
CREATE INDEX "AjusteInventario_tiendaId_fecha_idx" ON "AjusteInventario"("tiendaId", "fecha" DESC);

-- CreateIndex
CREATE INDEX "MovimientoInventario_tiendaId_fecha_tipo_idx" ON "MovimientoInventario"("tiendaId", "fecha", "tipo");

-- CreateIndex
CREATE INDEX "OrdenCompra_tiendaId_estado_fechaSolicitud_idx" ON "OrdenCompra"("tiendaId", "estado", "fechaSolicitud" DESC);

-- CreateIndex
CREATE INDEX "Producto_codigoOEM_idx" ON "Producto"("codigoOEM");

-- CreateIndex
CREATE INDEX "Producto_tiendaId_disponible_stock_idx" ON "Producto"("tiendaId", "disponible", "stock");

-- CreateIndex
CREATE INDEX "Producto_disponible_categoriaId_precio_idx" ON "Producto"("disponible", "categoriaId", "precio");

-- CreateIndex
CREATE INDEX "Venta_perfilClienteId_idx" ON "Venta"("perfilClienteId");

-- CreateIndex
CREATE INDEX "Venta_tiendaId_fecha_idx" ON "Venta"("tiendaId", "fecha" DESC);

-- CreateIndex
CREATE INDEX "Venta_metodoPago_idx" ON "Venta"("metodoPago");

-- AddForeignKey
ALTER TABLE "PerfilCliente" ADD CONSTRAINT "PerfilCliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilCliente" ADD CONSTRAINT "PerfilCliente_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_perfilClienteId_fkey" FOREIGN KEY ("perfilClienteId") REFERENCES "PerfilCliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoVenta" ADD CONSTRAINT "PagoVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
