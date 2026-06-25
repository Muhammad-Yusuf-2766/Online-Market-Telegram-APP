-- Phase 2/3 schema alignment: taxonomy, promotions, wishlist, recommendations,
-- segments, broadcasts, loyalty tiers, inventory, plus new columns on
-- existing User/Product/Order/RewardSettings tables.

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE "UserTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE "ProductGender" AS ENUM ('MEN', 'WOMEN', 'UNISEX');
CREATE TYPE "PromoCodeKind" AS ENUM ('PERCENT', 'FIXED', 'FREE_SHIPPING', 'FIRST_ORDER');
CREATE TYPE "PromoAppliesTo" AS ENUM ('ALL', 'CATEGORY', 'PRODUCT');
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED');

-- ============================================================================
-- USER: loyalty tier columns
-- ============================================================================
ALTER TABLE "User"
  ADD COLUMN "tier" "UserTier" NOT NULL DEFAULT 'BRONZE',
  ADD COLUMN "tierComputedAt" TIMESTAMP(3);

-- ============================================================================
-- REWARD SETTINGS: tier multipliers + tier referral overrides
-- ============================================================================
ALTER TABLE "RewardSettings"
  ADD COLUMN "bronzeCoinMultiplier"   DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  ADD COLUMN "silverCoinMultiplier"   DOUBLE PRECISION NOT NULL DEFAULT 1.05,
  ADD COLUMN "goldCoinMultiplier"     DOUBLE PRECISION NOT NULL DEFAULT 1.1,
  ADD COLUMN "platinumCoinMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.15,
  ADD COLUMN "silverReferralCoins"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "goldReferralCoins"      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "platinumReferralCoins"  INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- PRODUCT: taxonomy + merchandising + inventory threshold
-- ============================================================================
ALTER TABLE "Product"
  ADD COLUMN "categoryId"        TEXT,
  ADD COLUMN "brandId"           TEXT,
  ADD COLUMN "familyId"          TEXT,
  ADD COLUMN "gender"            "ProductGender" NOT NULL DEFAULT 'UNISEX',
  ADD COLUMN "notesTop"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "notesHeart"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "notesBase"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "isBestseller"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isNewArrival"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "releaseYear"       INTEGER,
  ADD COLUMN "oldPriceUzs"       INTEGER,
  ADD COLUMN "discountPercent"   INTEGER,
  ADD COLUMN "lowStockThreshold" INTEGER;

-- ============================================================================
-- ORDER: shipment status, promo code, discount
-- ============================================================================
ALTER TABLE "Order"
  ADD COLUMN "shipmentStatus" TEXT,
  ADD COLUMN "promoCodeId"    TEXT,
  ADD COLUMN "discountUzs"    INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- TAXONOMY TABLES
-- ============================================================================
CREATE TABLE "Category" (
  "id"        TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "parentId"  TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

CREATE TABLE "Brand" (
  "id"        TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "logoUrl"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

CREATE TABLE "FragranceFamily" (
  "id"        TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FragranceFamily_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FragranceFamily_slug_key" ON "FragranceFamily"("slug");

-- ============================================================================
-- PROMOTIONS
-- ============================================================================
CREATE TABLE "PromoCode" (
  "id"           TEXT NOT NULL,
  "code"         TEXT NOT NULL,
  "kind"         "PromoCodeKind" NOT NULL,
  "value"        INTEGER NOT NULL,
  "startsAt"     TIMESTAMP(3),
  "endsAt"       TIMESTAMP(3),
  "usageLimit"   INTEGER,
  "perUserLimit" INTEGER,
  "minOrderUzs"  INTEGER,
  "appliesTo"    "PromoAppliesTo" NOT NULL DEFAULT 'ALL',
  "categoryId"   TEXT,
  "productId"    TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

CREATE TABLE "PromoRedemption" (
  "id"          TEXT NOT NULL,
  "promoCodeId" TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "orderId"     TEXT NOT NULL,
  "discountUzs" INTEGER NOT NULL,
  "redeemedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PromoRedemption_promoCodeId_redeemedAt_idx" ON "PromoRedemption"("promoCodeId", "redeemedAt");
CREATE INDEX "PromoRedemption_userId_redeemedAt_idx"     ON "PromoRedemption"("userId", "redeemedAt");

CREATE TABLE "Bundle" (
  "id"            TEXT NOT NULL,
  "title"         TEXT NOT NULL,
  "discountKind"  "PromoCodeKind" NOT NULL,
  "discountValue" INTEGER NOT NULL,
  "imageUrl"      TEXT,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BundleProduct" (
  "id"        TEXT NOT NULL,
  "bundleId"  TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BundleProduct_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BundleProduct_bundleId_productId_key" ON "BundleProduct"("bundleId", "productId");

-- ============================================================================
-- WISHLIST + RECOMMENDATIONS
-- ============================================================================
CREATE TABLE "Wishlist" (
  "id"                   TEXT NOT NULL,
  "userId"               TEXT NOT NULL,
  "productId"            TEXT NOT NULL,
  "notifyBackInStock"    BOOLEAN NOT NULL DEFAULT true,
  "notifyPriceDrop"      BOOLEAN NOT NULL DEFAULT true,
  "lastNotifiedPriceUzs" INTEGER,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Wishlist_userId_productId_key" ON "Wishlist"("userId", "productId");

CREATE TABLE "ProductCoPurchase" (
  "id"            TEXT NOT NULL,
  "productFromId" TEXT NOT NULL,
  "productToId"   TEXT NOT NULL,
  "score"         INTEGER NOT NULL,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductCoPurchase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductCoPurchase_productFromId_productToId_key"
  ON "ProductCoPurchase"("productFromId", "productToId");
CREATE INDEX "ProductCoPurchase_productFromId_score_idx"
  ON "ProductCoPurchase"("productFromId", "score");

-- ============================================================================
-- SEGMENTS + BROADCASTS
-- ============================================================================
CREATE TABLE "UserSegment" (
  "id"              TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "definition"      JSONB NOT NULL,
  "userCountCached" INTEGER NOT NULL DEFAULT 0,
  "recomputedAt"    TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSegment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserSegment_name_key" ON "UserSegment"("name");

CREATE TABLE "UserSegmentMembership" (
  "id"        TEXT NOT NULL,
  "segmentId" TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSegmentMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserSegmentMembership_segmentId_userId_key"
  ON "UserSegmentMembership"("segmentId", "userId");
CREATE INDEX "UserSegmentMembership_userId_idx" ON "UserSegmentMembership"("userId");

CREATE TABLE "Broadcast" (
  "id"             TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "bodyUz"         TEXT NOT NULL,
  "bodyRu"         TEXT NOT NULL,
  "imageUrl"       TEXT,
  "segmentId"      TEXT NOT NULL,
  "coinGiftAmount" INTEGER,
  "promoCodeId"    TEXT,
  "scheduledFor"   TIMESTAMP(3),
  "status"         "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
  "sentCount"      INTEGER NOT NULL DEFAULT 0,
  "errorCount"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BroadcastLog" (
  "id"          TEXT NOT NULL,
  "broadcastId" TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "status"      TEXT NOT NULL,
  "error"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BroadcastLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BroadcastLog_broadcastId_createdAt_idx"
  ON "BroadcastLog"("broadcastId", "createdAt");

-- ============================================================================
-- INVENTORY
-- ============================================================================
CREATE TABLE "StockMovement" (
  "id"        TEXT NOT NULL,
  "orderId"   TEXT,
  "productId" TEXT NOT NULL,
  "delta"     INTEGER NOT NULL,
  "reason"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StockMovement_productId_createdAt_idx"
  ON "StockMovement"("productId", "createdAt");

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================
ALTER TABLE "Category"
  ADD CONSTRAINT "Category_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Product_brandId_fkey"
    FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Product_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "FragranceFamily"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_promoCodeId_fkey"
    FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PromoCode"
  ADD CONSTRAINT "PromoCode_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PromoCode_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PromoRedemption"
  ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey"
    FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PromoRedemption_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BundleProduct"
  ADD CONSTRAINT "BundleProduct_bundleId_fkey"
    FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BundleProduct_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Wishlist"
  ADD CONSTRAINT "Wishlist_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Wishlist_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductCoPurchase"
  ADD CONSTRAINT "ProductCoPurchase_productFromId_fkey"
    FOREIGN KEY ("productFromId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ProductCoPurchase_productToId_fkey"
    FOREIGN KEY ("productToId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSegmentMembership"
  ADD CONSTRAINT "UserSegmentMembership_segmentId_fkey"
    FOREIGN KEY ("segmentId") REFERENCES "UserSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "UserSegmentMembership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Broadcast"
  ADD CONSTRAINT "Broadcast_segmentId_fkey"
    FOREIGN KEY ("segmentId") REFERENCES "UserSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Broadcast_promoCodeId_fkey"
    FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BroadcastLog"
  ADD CONSTRAINT "BroadcastLog_broadcastId_fkey"
    FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BroadcastLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
  ADD CONSTRAINT "StockMovement_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StockMovement_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
