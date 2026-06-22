import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, User, UserTier } from "@prisma/client";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult, type PaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";
import type { ReferralTreeNode } from "../users/users.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async findAllPaginated(
    query: PaginationQueryDto & { q?: string; tier?: UserTier },
  ): Promise<PaginatedResult<User>> {
    const { page, pageSize, skip } = paginationParams(query);
    const where: Prisma.UserWhereInput = {};
    const trimmedQ = query.q?.trim();
    if (trimmedQ) {
      where.OR = [
        { telegramId: { contains: trimmedQ } },
        { telegramUsername: { contains: trimmedQ, mode: "insensitive" } },
        { firstName: { contains: trimmedQ, mode: "insensitive" } },
        { lastName: { contains: trimmedQ, mode: "insensitive" } },
        { phone: { contains: trimmedQ } },
      ];
    }
    if (query.tier) {
      where.tier = query.tier;
    }
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);
    return toPaginatedResult(items, total, page, pageSize);
  }

  async getReferralTree(userId: string, maxDepth: number): Promise<ReferralTreeNode> {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!u) {
      throw new NotFoundException("User not found");
    }
    return this.usersService.getReferralTree(userId, maxDepth);
  }

  async getUser360(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          include: {
            items: true,
            promoCode: { select: { code: true, kind: true, value: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        coinLedger: { orderBy: { createdAt: "desc" }, take: 100 },
        wishlistItems: { include: { product: true }, take: 100 },
        segmentMemberships: { include: { segment: true } },
        broadcastLogs: { include: { broadcast: true }, orderBy: { createdAt: "desc" }, take: 100 },
        adminCoinGifts: { orderBy: { createdAt: "desc" }, take: 100 },
        productFeedbacks: { include: { product: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 50 },
        referralRewardsAsReferrer: {
          include: { referee: { select: { id: true, firstName: true, lastName: true, telegramUsername: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        referralRewardAsReferee: true,
        referredBy: { select: { id: true, firstName: true, lastName: true, telegramUsername: true } },
        campaign: { select: { id: true, slug: true, name: true } },
        promoRedemptions: {
          include: { promoCode: { select: { code: true, kind: true, value: true } } },
          orderBy: { redeemedAt: "desc" },
          take: 50,
        },
        cart: { include: { items: { include: { product: { select: { title: true, priceUzs: true } } } } } },
        _count: { select: { orders: true, referrals: true, wishlistItems: true } },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    const totalRevenue = user.orders.reduce((acc, order) => acc + order.cashPaidUzs + order.coinsAppliedUzs, 0);
    const cancelledOrders = user.orders.filter((o) => o.status === "CANCELLED").length;
    const deliveredOrders = user.orders.filter((o) => o.status === "DELIVERED").length;
    const lastOrder = user.orders[0]?.createdAt ?? null;
    return {
      user,
      kpis: {
        ordersCount: user._count.orders,
        deliveredOrders,
        cancelledOrders,
        ltvUzs: totalRevenue,
        aovUzs: user.orders.length > 0 ? Math.round(totalRevenue / user.orders.length) : 0,
        referralCount: user._count.referrals,
        wishlistCount: user._count.wishlistItems,
        coinsLifetimeEarned: user.coinLedger
          .filter((l) => l.delta > 0)
          .reduce((acc, l) => acc + l.delta, 0),
        coinsLifetimeSpent: user.coinLedger
          .filter((l) => l.delta < 0)
          .reduce((acc, l) => acc + Math.abs(l.delta), 0),
        lastOrderAt: lastOrder,
      },
    };
  }
}
