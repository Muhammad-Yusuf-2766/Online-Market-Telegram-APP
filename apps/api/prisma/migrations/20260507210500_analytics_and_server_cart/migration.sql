-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM (
  'APP_OPEN',
  'PRODUCT_VIEW',
  'SEARCH',
  'ADD_TO_CART',
  'REMOVE_FROM_CART',
  'CHECKOUT_START',
  'CHECKOUT_SUBMIT',
  'ORDER_CREATED',
  'WISHLIST_ADD',
  'COIN_TOGGLE',
  'CAMPAIGN_LANDED'
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "eventType" "AnalyticsEventType" NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "productId" TEXT,
  "orderId" TEXT,
  "searchQuery" TEXT,
  "properties" JSONB,
  "userAgent" TEXT,
  "tmaPlatform" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sizeSlug" TEXT,
  "qty" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");
CREATE INDEX "AnalyticsEvent_sessionId_createdAt_idx" ON "AnalyticsEvent"("sessionId", "createdAt");
CREATE INDEX "AnalyticsEvent_productId_createdAt_idx" ON "AnalyticsEvent"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");
CREATE UNIQUE INDEX "CartItem_cartId_productId_sizeSlug_key" ON "CartItem"("cartId", "productId", "sizeSlug");
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent"
ADD CONSTRAINT "AnalyticsEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Cart"
ADD CONSTRAINT "Cart_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_cartId_fkey"
FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
