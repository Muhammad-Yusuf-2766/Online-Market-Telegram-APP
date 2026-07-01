-- CreateTable
CREATE TABLE "MarketBranding" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "marketName" TEXT NOT NULL DEFAULT 'Ansor Market',
    "marketSlogan" TEXT NOT NULL DEFAULT 'Koreadagi halal mahsulotlar',
    "marketLogoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketBranding_pkey" PRIMARY KEY ("id")
);
