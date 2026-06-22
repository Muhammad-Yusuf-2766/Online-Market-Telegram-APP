import { BadRequestException, Injectable } from "@nestjs/common";
import { CoinLedgerKind, OrderStatus, type Order, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const QUALIFYING_STATUSES: OrderStatus[] = ["CONFIRMED", "SHIPPED", "DELIVERED"];

function isQualifying(status: OrderStatus): boolean {
  return QUALIFYING_STATUSES.includes(status);
}

@Injectable()
export class CoinsService {
  constructor(private readonly prisma: PrismaService) {}

  async debitCheckoutSpend(
    tx: Prisma.TransactionClient,
    userId: string,
    orderId: string,
    amount: number,
  ): Promise<void> {
    if (amount <= 0) {
      return;
    }
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { coinBalance: true },
    });
    if (user.coinBalance < amount) {
      throw new BadRequestException("Insufficient coin balance");
    }
    await tx.user.update({
      where: { id: userId },
      data: { coinBalance: { decrement: amount } },
    });
    await tx.coinLedgerEntry.create({
      data: {
        userId,
        delta: -amount,
        kind: CoinLedgerKind.CHECKOUT_SPEND,
        metadata: { orderId },
      },
    });
  }

  /**
   * When an order is cancelled, return spent coins once (idempotent via ledger lookup).
   */
  async refundOrderCoinsIfNeeded(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, coinsAppliedUzs: true },
    });
    if (!order || order.coinsAppliedUzs <= 0) {
      return;
    }
    const existing = await tx.coinLedgerEntry.findFirst({
      where: {
        userId: order.userId,
        kind: CoinLedgerKind.ORDER_CANCEL_REFUND,
        metadata: { equals: { orderId: order.id } },
      },
    });
    if (existing) {
      return;
    }
    await tx.user.update({
      where: { id: order.userId },
      data: { coinBalance: { increment: order.coinsAppliedUzs } },
    });
    await tx.coinLedgerEntry.create({
      data: {
        userId: order.userId,
        delta: order.coinsAppliedUzs,
        kind: CoinLedgerKind.ORDER_CANCEL_REFUND,
        metadata: { orderId: order.id },
      },
    });
  }

  /**
   * On first transition of the referee's chronologically-first order into a qualifying status,
   * pay the referrer (once per referee) per RewardSettings.
   */
  async tryReferralPayoutOnOrderQualifying(
    tx: Prisma.TransactionClient,
    order: Pick<Order, "id" | "userId" | "status" | "createdAt">,
    previousStatus: OrderStatus,
  ): Promise<{ telegramId: string; locale: string; coins: number } | null> {
    if (!isQualifying(order.status)) {
      return null;
    }
    if (isQualifying(previousStatus)) {
      return null;
    }

    const qualifying = await tx.order.findMany({
      where: { userId: order.userId, status: { in: QUALIFYING_STATUSES } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    if (qualifying[0]?.id !== order.id) {
      return null;
    }

    const existingReward = await tx.referralReward.findUnique({
      where: { refereeId: order.userId },
    });
    if (existingReward) {
      return null;
    }

    const referee = await tx.user.findUnique({
      where: { id: order.userId },
      select: { referredByUserId: true },
    });
    const referrerId = referee?.referredByUserId;
    if (!referrerId || referrerId === order.userId) {
      return null;
    }

    const settings = await tx.rewardSettings.findUnique({ where: { id: "singleton" } });
    let coins = settings?.referralCoins ?? 0;
    if (settings) {
      const referrer = await tx.user.findUnique({
        where: { id: referrerId },
        select: { tier: true },
      });
      if (referrer?.tier === "SILVER" && settings.silverReferralCoins > 0) coins = settings.silverReferralCoins;
      if (referrer?.tier === "GOLD" && settings.goldReferralCoins > 0) coins = settings.goldReferralCoins;
      if (referrer?.tier === "PLATINUM" && settings.platinumReferralCoins > 0) coins = settings.platinumReferralCoins;
    }

    if (coins > 0) {
      await tx.user.update({
        where: { id: referrerId },
        data: { coinBalance: { increment: coins } },
      });
      await tx.coinLedgerEntry.create({
        data: {
          userId: referrerId,
          delta: coins,
          kind: CoinLedgerKind.REFERRAL_EARNED,
          metadata: { orderId: order.id, refereeId: order.userId },
        },
      });
    }

    await tx.referralReward.create({
      data: {
        referrerId,
        refereeId: order.userId,
        orderId: order.id,
        coins,
      },
    });

    if (coins <= 0) {
      return null;
    }
    const referrer = await tx.user.findUniqueOrThrow({
      where: { id: referrerId },
      select: { telegramId: true, locale: true },
    });
    return { telegramId: referrer.telegramId, locale: referrer.locale, coins };
  }
}
