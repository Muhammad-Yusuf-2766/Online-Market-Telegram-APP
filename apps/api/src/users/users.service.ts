import { Injectable } from "@nestjs/common";
import { CoinLedgerKind, Prisma, UserGender, type User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

export type ReferralTreeNode = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  referralCode: string;
  createdAt: string;
  children: ReferralTreeNode[];
};

export type ProfileCoinPayout = {
  delta: number;
  profileReason: string;
};

const INBOX_KINDS: CoinLedgerKind[] = [
  CoinLedgerKind.REFERRAL_EARNED,
  CoinLedgerKind.PROFILE_BONUS,
  CoinLedgerKind.ADMIN_GIFT,
];

function isProfileComplete(u: User): boolean {
  return Boolean(
    (u.phone ?? "").trim() &&
      (u.firstName ?? "").trim() &&
      (u.lastName ?? "").trim() &&
      u.birthDate != null &&
      u.gender !== UserGender.UNSPECIFIED,
  );
}

function applyTierMultiplier(base: number, tier: User["tier"], settings: {
  bronzeCoinMultiplier: number;
  silverCoinMultiplier: number;
  goldCoinMultiplier: number;
  platinumCoinMultiplier: number;
}): number {
  const mult =
    tier === "PLATINUM"
      ? settings.platinumCoinMultiplier
      : tier === "GOLD"
        ? settings.goldCoinMultiplier
        : tier === "SILVER"
          ? settings.silverCoinMultiplier
          : settings.bronzeCoinMultiplier;
  return Math.max(0, Math.round(base * (mult || 1)));
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramNotify: TelegramNotifyService,
  ) {}

  async getMe(userId: string): Promise<User> {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }

  async updateMe(userId: string, dto: UpdateProfileDto): Promise<User> {
    const before = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const birthDate =
      dto.birthDate !== undefined ? new Date(`${dto.birthDate}T00:00:00.000Z`) : undefined;

    const payouts = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          phone: dto.phone,
          firstName: dto.firstName,
          lastName: dto.lastName,
          ...(birthDate !== undefined ? { birthDate } : {}),
          ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
          ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        },
      });

      return this.applyProfileBonuses(tx, before, updated);
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { telegramId: true, locale: true },
    });
    for (const p of payouts) {
      void this.telegramNotify.notifyCoinsCredit(
        user.telegramId,
        p.delta,
        user.locale,
        "profile",
        p.profileReason,
      );
    }

    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }

  private async applyProfileBonuses(
    tx: Prisma.TransactionClient,
    before: User,
    after: User,
  ): Promise<ProfileCoinPayout[]> {
    const payouts: ProfileCoinPayout[] = [];
    const settings = await tx.rewardSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      return payouts;
    }

    const lastNow = (after.lastName ?? "").trim().length > 0;
    const lastBefore = (before.lastName ?? "").trim().length > 0;
    if (lastNow && !lastBefore && !before.profileBonusLastNameDone) {
      const coins = applyTierMultiplier(settings.profileLastNameCoins, after.tier, settings);
      if (coins > 0) {
        await tx.user.update({
          where: { id: after.id },
          data: { coinBalance: { increment: coins }, profileBonusLastNameDone: true },
        });
        await tx.coinLedgerEntry.create({
          data: {
            userId: after.id,
            delta: coins,
            kind: CoinLedgerKind.PROFILE_BONUS,
            metadata: { reason: "lastName" },
          },
        });
        payouts.push({ delta: coins, profileReason: "lastName" });
      } else {
        await tx.user.update({
          where: { id: after.id },
          data: { profileBonusLastNameDone: true },
        });
      }
    }

    const birthNow = after.birthDate != null;
    const birthBefore = before.birthDate != null;
    if (birthNow && !birthBefore && !before.profileBonusBirthdateDone) {
      const coins = applyTierMultiplier(settings.profileBirthdayCoins, after.tier, settings);
      if (coins > 0) {
        await tx.user.update({
          where: { id: after.id },
          data: { coinBalance: { increment: coins }, profileBonusBirthdateDone: true },
        });
        await tx.coinLedgerEntry.create({
          data: {
            userId: after.id,
            delta: coins,
            kind: CoinLedgerKind.PROFILE_BONUS,
            metadata: { reason: "birthDate" },
          },
        });
        payouts.push({ delta: coins, profileReason: "birthDate" });
      } else {
        await tx.user.update({
          where: { id: after.id },
          data: { profileBonusBirthdateDone: true },
        });
      }
    }

    const genderNow = after.gender !== UserGender.UNSPECIFIED;
    const genderBefore = before.gender !== UserGender.UNSPECIFIED;
    if (genderNow && !genderBefore && !before.profileBonusGenderDone) {
      const coins = applyTierMultiplier(settings.profileGenderCoins, after.tier, settings);
      if (coins > 0) {
        await tx.user.update({
          where: { id: after.id },
          data: { coinBalance: { increment: coins }, profileBonusGenderDone: true },
        });
        await tx.coinLedgerEntry.create({
          data: {
            userId: after.id,
            delta: coins,
            kind: CoinLedgerKind.PROFILE_BONUS,
            metadata: { reason: "gender" },
          },
        });
        payouts.push({ delta: coins, profileReason: "gender" });
      } else {
        await tx.user.update({
          where: { id: after.id },
          data: { profileBonusGenderDone: true },
        });
      }
    }

    const latest = await tx.user.findUniqueOrThrow({ where: { id: after.id } });
    if (isProfileComplete(latest) && !before.profileBonusFullDone) {
      const coins = applyTierMultiplier(settings.profileFullCoins, after.tier, settings);
      if (coins > 0) {
        await tx.user.update({
          where: { id: after.id },
          data: { coinBalance: { increment: coins }, profileBonusFullDone: true },
        });
        await tx.coinLedgerEntry.create({
          data: {
            userId: after.id,
            delta: coins,
            kind: CoinLedgerKind.PROFILE_BONUS,
            metadata: { reason: "fullProfile" },
          },
        });
        payouts.push({ delta: coins, profileReason: "fullProfile" });
      } else {
        await tx.user.update({
          where: { id: after.id },
          data: { profileBonusFullDone: true },
        });
      }
    }

    return payouts;
  }

  async getReferralTree(userId: string, maxDepth: number): Promise<ReferralTreeNode> {
    const clamped = Math.min(8, Math.max(1, maxDepth));

    const build = async (id: string, depth: number): Promise<ReferralTreeNode> => {
      const row = await this.prisma.user.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          referralCode: true,
          createdAt: true,
        },
      });
      if (depth >= clamped) {
        return {
          ...row,
          createdAt: row.createdAt.toISOString(),
          children: [],
        };
      }
      const childIds = await this.prisma.user.findMany({
        where: { referredByUserId: id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      const children = await Promise.all(childIds.map((c) => build(c.id, depth + 1)));
      return {
        ...row,
        createdAt: row.createdAt.toISOString(),
        children,
      };
    };

    return build(userId, 0);
  }

  async getCoinInbox(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { coinInboxAckAt: true },
    });
    const rows = await this.prisma.coinLedgerEntry.findMany({
      where: {
        userId,
        kind: { in: INBOX_KINDS },
        ...(user.coinInboxAckAt ? { createdAt: { gt: user.coinInboxAckAt } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      delta: r.delta,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async ackCoinInbox(userId: string): Promise<{ ok: true }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { coinInboxAckAt: new Date() },
    });
    return { ok: true };
  }

  async getRecentlyViewed(userId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: { userId, eventType: "PRODUCT_VIEW", productId: { not: null } },
      select: { productId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const event of events) {
      if (!event.productId || seen.has(event.productId)) continue;
      seen.add(event.productId);
      ids.push(event.productId);
      if (ids.length >= 20) break;
    }
    if (ids.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        description: true,
        priceUzs: true,
        sizes: true,
        images: true,
        stock: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }
}
