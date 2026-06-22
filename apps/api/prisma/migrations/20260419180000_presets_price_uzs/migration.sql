-- CreateTable
CREATE TABLE "ProductSizePreset" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "grams" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSizePreset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductSizePreset_slug_key" ON "ProductSizePreset"("slug");

-- Orders: minor-units -> whole UZS (legacy stored value / 100)
ALTER TABLE "Order" ADD COLUMN "subtotalUzs" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "totalUzs" INTEGER NOT NULL DEFAULT 0;
UPDATE "Order" SET "subtotalUzs" = ROUND(COALESCE("subtotalCents", 0) / 100.0)::INTEGER;
UPDATE "Order" SET "totalUzs" = ROUND(COALESCE("totalCents", 0) / 100.0)::INTEGER;
ALTER TABLE "Order" DROP COLUMN "subtotalCents";
ALTER TABLE "Order" DROP COLUMN "totalCents";

ALTER TABLE "OrderItem" ADD COLUMN "unitPriceUzs" INTEGER NOT NULL DEFAULT 0;
UPDATE "OrderItem" SET "unitPriceUzs" = ROUND(COALESCE("unitPriceCents", 0) / 100.0)::INTEGER;
ALTER TABLE "OrderItem" DROP COLUMN "unitPriceCents";

ALTER TABLE "Product" ADD COLUMN "priceUzs" INTEGER NOT NULL DEFAULT 0;
UPDATE "Product" SET "priceUzs" = ROUND(COALESCE("priceCents", 0) / 100.0)::INTEGER;
ALTER TABLE "Product" DROP COLUMN "priceCents";

-- Old embedded sizes used different JSON; products must re-link presets in admin or via seed.
UPDATE "Product" SET "sizes" = NULL WHERE "sizes" IS NOT NULL;
