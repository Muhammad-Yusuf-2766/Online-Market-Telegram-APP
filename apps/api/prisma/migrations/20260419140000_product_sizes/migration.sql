-- AlterTable
ALTER TABLE "Product" ADD COLUMN "sizes" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "sizeId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "sizeLabelSnapshot" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "gramsSnapshot" INTEGER;
