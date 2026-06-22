-- AlterTable
ALTER TABLE "User" ADD COLUMN "profileBonusFullDone" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RewardSettings" ADD COLUMN "profileFullCoins" INTEGER NOT NULL DEFAULT 0;
