-- CreateEnum
CREATE TYPE "ProductFeedbackStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "ratingAvg" DOUBLE PRECISION,
ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductFeedback" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "status" "ProductFeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductFeedback_userId_productId_key" ON "ProductFeedback"("userId", "productId");

-- CreateIndex
CREATE INDEX "ProductFeedback_productId_status_idx" ON "ProductFeedback"("productId", "status");

-- CreateIndex
CREATE INDEX "ProductFeedback_status_createdAt_idx" ON "ProductFeedback"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductFeedback" ADD CONSTRAINT "ProductFeedback_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeedback" ADD CONSTRAINT "ProductFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
