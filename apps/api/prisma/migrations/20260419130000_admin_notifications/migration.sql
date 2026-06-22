-- CreateEnum
CREATE TYPE "AdminNotificationKind" AS ENUM ('ORDER_CREATED', 'ORDER_UPDATED');

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "kind" "AdminNotificationKind" NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- CreateTable
CREATE TABLE "AdminNotificationRead" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotificationRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminNotificationRead_notificationId_adminUserId_key" ON "AdminNotificationRead"("notificationId", "adminUserId");

CREATE INDEX "AdminNotificationRead_adminUserId_idx" ON "AdminNotificationRead"("adminUserId");

-- AddForeignKey
ALTER TABLE "AdminNotificationRead" ADD CONSTRAINT "AdminNotificationRead_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "AdminNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminNotificationRead" ADD CONSTRAINT "AdminNotificationRead_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
