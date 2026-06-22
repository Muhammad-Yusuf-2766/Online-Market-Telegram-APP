-- CreateEnum
CREATE TYPE "UserGender" AS ENUM ('UNSPECIFIED', 'MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "CoinLedgerKind" AS ENUM (
  'CHECKOUT_SPEND',
  'ORDER_CANCEL_REFUND',
  'REFERRAL_EARNED',
  'PROFILE_BONUS',
  'ADMIN_GIFT',
  'ADMIN_ADJUSTMENT'
);

-- CreateTable
CREATE TABLE "RewardSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "referralCoins" INTEGER NOT NULL DEFAULT 0,
    "profileBirthdayCoins" INTEGER NOT NULL DEFAULT 0,
    "profileGenderCoins" INTEGER NOT NULL DEFAULT 0,
    "profileLastNameCoins" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "RewardSettings" ("id", "referralCoins", "profileBirthdayCoins", "profileGenderCoins", "profileLastNameCoins")
VALUES ('singleton', 0, 0, 0, 0);

-- CreateTable
CREATE TABLE "TrafficCampaign" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficCampaign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrafficCampaign_slug_key" ON "TrafficCampaign"("slug");

-- AlterTable User (columns without FK to new tables first)
ALTER TABLE "User" ADD COLUMN "gender" "UserGender" NOT NULL DEFAULT 'UNSPECIFIED';
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredByUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "campaignId" TEXT;
ALTER TABLE "User" ADD COLUMN "coinBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "profileBonusBirthdateDone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "profileBonusGenderDone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "profileBonusLastNameDone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "coinInboxAckAt" TIMESTAMP(3);

UPDATE "User" SET "referralCode" = lower(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 16))
WHERE "referralCode" IS NULL;

ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

ALTER TABLE "User" ADD CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "TrafficCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CoinLedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "kind" "CoinLedgerKind" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoinLedgerEntry_userId_createdAt_idx" ON "CoinLedgerEntry"("userId", "createdAt");
CREATE INDEX "CoinLedgerEntry_kind_idx" ON "CoinLedgerEntry"("kind");

ALTER TABLE "CoinLedgerEntry" ADD CONSTRAINT "CoinLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralReward_refereeId_key" ON "ReferralReward"("refereeId");
CREATE INDEX "ReferralReward_referrerId_idx" ON "ReferralReward"("referrerId");

ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AdminCoinGift" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "coins" INTEGER NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminCoinGift_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminCoinGift_targetUserId_idx" ON "AdminCoinGift"("targetUserId");
CREATE INDEX "AdminCoinGift_createdAt_idx" ON "AdminCoinGift"("createdAt");

ALTER TABLE "AdminCoinGift" ADD CONSTRAINT "AdminCoinGift_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminCoinGift" ADD CONSTRAINT "AdminCoinGift_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN "coinsAppliedUzs" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "cashPaidUzs" INTEGER NOT NULL DEFAULT 0;

UPDATE "Order" SET "cashPaidUzs" = "subtotalUzs" WHERE "cashPaidUzs" = 0;
