import { BadRequestException, Injectable } from "@nestjs/common";
import { OrderStatus, UserTier } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type DashboardSeriesPoint = {
  date: string;
  orders: number;
  newUsers: number;
  cashNonCancelledUzs: number;
  coinsAppliedNonCancelledUzs: number;
  cancelledOrderCount: number;
  campaignSignups: number;
};

export type DashboardStatsResult = {
  totals: {
    productCount: number;
    ordersInRange: number;
    newUsersInRange: number;
    cashNonCancelledUzs: number;
    coinsAppliedNonCancelledUzs: number;
    cancelledOrdersInRange: number;
    campaignSignupsInRange: number;
  };
  series: DashboardSeriesPoint[];
};

export type InsightsFunnelResult = {
  fromIso: string;
  toIso: string;
  steps: Array<{ key: string; label: string; value: number; conversionFromPrev: number | null }>;
};

export type InsightsAovLtvResult = {
  ordersCount: number;
  paidOrdersCount: number;
  revenueUzs: number;
  aovUzs: number;
  ltvUzs: number;
  repeatPurchaseRate: number;
};

export type InsightsTopProductResult = {
  productId: string;
  title: string;
  value: number;
};

export type InsightsSearchTermResult = {
  query: string;
  count: number;
  zeroResultCount: number;
};

export type DashboardOverviewResult = {
  users: {
    total: number;
    tierDistribution: Record<UserTier, number>;
    activeLast7d: number;
    coinBalanceTotal: number;
    avgCoinBalance: number;
    profileCompletionRate: number;
  };
  orders: {
    total: number;
    pendingCount: number;
    confirmedCount: number;
    shippedCount: number;
    deliveredCount: number;
    cancelledCount: number;
  };
  catalog: {
    productCount: number;
    bestsellerCount: number;
    newArrivalCount: number;
    discountedCount: number;
    averagePriceUzs: number;
  };
  inventory: {
    totalStockGrams: number;
    totalStockPieces: number;
    productsTrackedGrams: number;
    productsTrackedPieces: number;
    lowStockCount: number;
  };
  engagement: {
    wishlistCount: number;
    cartItemCount: number;
    referralRewardsCount: number;
    productFeedbackPending: number;
  };
};

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(fromIso: string, toIso: string): Promise<DashboardStatsResult> {
    const { from, to } = this.parseRange(fromIso, toIso);

    const [
      productCount,
      ordersInRange,
      newUsersInRange,
      orderDates,
      userDates,
      ordersFinance,
      usersCampaign,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.order.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true },
      }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true, status: true, cashPaidUzs: true, coinsAppliedUzs: true },
      }),
      this.prisma.user.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          campaignId: { not: null },
        },
        select: { createdAt: true },
      }),
    ]);

    const ordersByDay = this.countByUtcDay(orderDates.map((o) => o.createdAt));
    const usersByDay = this.countByUtcDay(userDates.map((u) => u.createdAt));
    const campaignByDay = this.countByUtcDay(usersCampaign.map((u) => u.createdAt));

    const cashByDay = new Map<string, number>();
    const coinsByDay = new Map<string, number>();
    const cancelledCountByDay = new Map<string, number>();
    let cashNonCancelledUzs = 0;
    let coinsAppliedNonCancelledUzs = 0;
    let cancelledOrdersInRange = 0;
    for (const o of ordersFinance) {
      const key = o.createdAt.toISOString().slice(0, 10);
      if (o.status === OrderStatus.CANCELLED) {
        cancelledOrdersInRange += 1;
        cancelledCountByDay.set(key, (cancelledCountByDay.get(key) ?? 0) + 1);
      } else {
        cashNonCancelledUzs += o.cashPaidUzs;
        coinsAppliedNonCancelledUzs += o.coinsAppliedUzs;
        cashByDay.set(key, (cashByDay.get(key) ?? 0) + o.cashPaidUzs);
        coinsByDay.set(key, (coinsByDay.get(key) ?? 0) + o.coinsAppliedUzs);
      }
    }

    const series: DashboardSeriesPoint[] = [];
    for (const d of this.eachUtcDay(from, to)) {
      series.push({
        date: d,
        orders: ordersByDay.get(d) ?? 0,
        newUsers: usersByDay.get(d) ?? 0,
        cashNonCancelledUzs: cashByDay.get(d) ?? 0,
        coinsAppliedNonCancelledUzs: coinsByDay.get(d) ?? 0,
        cancelledOrderCount: cancelledCountByDay.get(d) ?? 0,
        campaignSignups: campaignByDay.get(d) ?? 0,
      });
    }

    return {
      totals: {
        productCount,
        ordersInRange,
        newUsersInRange,
        cashNonCancelledUzs,
        coinsAppliedNonCancelledUzs,
        cancelledOrdersInRange,
        campaignSignupsInRange: usersCampaign.length,
      },
      series,
    };
  }

  async getFunnel(fromIso: string, toIso: string): Promise<InsightsFunnelResult> {
    const { from, to } = this.parseRange(fromIso, toIso);
    const funnelSteps = [
      { key: "appOpen", label: "App open", eventType: "APP_OPEN" },
      { key: "productView", label: "Product view", eventType: "PRODUCT_VIEW" },
      { key: "addToCart", label: "Add to cart", eventType: "ADD_TO_CART" },
      { key: "checkoutStart", label: "Checkout start", eventType: "CHECKOUT_START" },
      { key: "checkoutSubmit", label: "Checkout submit", eventType: "CHECKOUT_SUBMIT" },
      { key: "orderPaid", label: "Order paid", eventType: "ORDER_CREATED" },
    ] as const;
    const eventTypes = funnelSteps.map((step) => step.eventType);
    const [events, paidOrders] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: {
          eventType: { in: eventTypes },
          createdAt: { gte: from, lte: to },
        },
        select: { sessionId: true, eventType: true, orderId: true, createdAt: true },
      }),
      this.prisma.order.findMany({
        where: {
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          createdAt: { gte: from, lte: to },
        },
        select: { id: true },
      }),
    ]);
    const paidOrderIds = new Set(paidOrders.map((order) => order.id));
    const stageIndexByEventType = new Map<string, number>(
      funnelSteps.map((step, index) => [step.eventType, index]),
    );
    const reachedSessionsByStep = funnelSteps.map(() => new Set<string>());
    const nextStepBySession = new Map<string, number>();
    const orderedEvents = events
      .filter(
        (event) =>
          event.eventType !== "ORDER_CREATED" ||
          (event.orderId != null && paidOrderIds.has(event.orderId)),
      )
      .sort((a, b) => {
        const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
        if (timeDiff !== 0) return timeDiff;
        return (
          (stageIndexByEventType.get(a.eventType) ?? Number.MAX_SAFE_INTEGER) -
          (stageIndexByEventType.get(b.eventType) ?? Number.MAX_SAFE_INTEGER)
        );
      });

    for (const event of orderedEvents) {
      const nextStep = nextStepBySession.get(event.sessionId) ?? 0;
      const expectedStep = funnelSteps[nextStep];
      if (!expectedStep || event.eventType !== expectedStep.eventType) continue;
      reachedSessionsByStep[nextStep].add(event.sessionId);
      nextStepBySession.set(event.sessionId, nextStep + 1);
    }

    const rawSteps = funnelSteps.map((step, index) => ({
      key: step.key,
      label: step.label,
      value: reachedSessionsByStep[index].size,
    }));
    const steps = rawSteps.map((step, idx) => {
      if (idx === 0) return { ...step, conversionFromPrev: null };
      const prev = rawSteps[idx - 1].value;
      return { ...step, conversionFromPrev: prev > 0 ? step.value / prev : 0 };
    });
    return {
      fromIso: from.toISOString(),
      toIso: to.toISOString(),
      steps,
    };
  }

  async getAovLtv(fromIso: string, toIso: string): Promise<InsightsAovLtvResult> {
    const { from, to } = this.parseRange(fromIso, toIso);
    const [orderAgg, paidOrders, usersWithOrders] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: { gte: from, lte: to } },
        _count: { id: true },
        _sum: { cashPaidUzs: true, coinsAppliedUzs: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: from, lte: to },
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
      }),
      this.prisma.order.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: from, lte: to } },
        _count: { _all: true },
      }),
    ]);
    const ordersCount = orderAgg._count.id;
    const revenueUzs = (orderAgg._sum.cashPaidUzs ?? 0) + (orderAgg._sum.coinsAppliedUzs ?? 0);
    const uniqueBuyers = usersWithOrders.length;
    const repeatUsers = usersWithOrders.filter((row) => row._count._all > 1).length;
    return {
      ordersCount,
      paidOrdersCount: paidOrders,
      revenueUzs,
      aovUzs: ordersCount > 0 ? Math.round(revenueUzs / ordersCount) : 0,
      ltvUzs: uniqueBuyers > 0 ? Math.round(revenueUzs / uniqueBuyers) : 0,
      repeatPurchaseRate: uniqueBuyers > 0 ? repeatUsers / uniqueBuyers : 0,
    };
  }

  async getTopProducts(
    fromIso: string,
    toIso: string,
    metric: "views" | "sales" | "revenue",
  ): Promise<InsightsTopProductResult[]> {
    const { from, to } = this.parseRange(fromIso, toIso);
    if (metric === "views") {
      const events = await this.prisma.analyticsEvent.findMany({
        where: { eventType: "PRODUCT_VIEW", createdAt: { gte: from, lte: to }, productId: { not: null } },
        select: { productId: true },
        take: 10000,
      });
      const viewMap = new Map<string, number>();
      for (const event of events) {
        if (!event.productId) continue;
        viewMap.set(event.productId, (viewMap.get(event.productId) ?? 0) + 1);
      }
      const grouped = [...viewMap.entries()]
        .map(([productId, count]) => ({ productId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      const ids = grouped.map((row) => row.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true },
      });
      const titleById = new Map(products.map((p) => [p.id, p.title]));
      return grouped.map((row) => ({
        productId: row.productId,
        title: titleById.get(row.productId) ?? row.productId,
        value: row.count,
      }));
    }

    const lines = await this.prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: from, lte: to } }, productId: { not: null } },
      select: { productId: true, quantity: true, unitPriceUzs: true, product: { select: { title: true } } },
    });
    const byProduct = new Map<string, { title: string; sales: number; revenue: number }>();
    for (const line of lines) {
      if (!line.productId) continue;
      const current = byProduct.get(line.productId) ?? {
        title: line.product?.title ?? line.productId,
        sales: 0,
        revenue: 0,
      };
      current.sales += line.quantity;
      current.revenue += line.quantity * line.unitPriceUzs;
      byProduct.set(line.productId, current);
    }
    return [...byProduct.entries()]
      .map(([productId, row]) => ({
        productId,
        title: row.title,
        value: metric === "sales" ? row.sales : row.revenue,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }

  async getOverview(): Promise<DashboardOverviewResult> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
    const [
      userTotal,
      userTiers,
      activeLast7d,
      coinBalanceAgg,
      profileFullCount,
      orderTotal,
      orderStatusGroups,
      productCount,
      bestsellerCount,
      newArrivalCount,
      discountedCount,
      avgPriceAgg,
      stockGramsAgg,
      stockPiecesAgg,
      productsTrackedGrams,
      productsTrackedPieces,
      lowStockProducts,
      wishlistCount,
      cartItemCount,
      referralRewardsCount,
      productFeedbackPending,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ["tier"], _count: { _all: true } }),
      this.prisma.analyticsEvent.findMany({
        where: { eventType: "APP_OPEN", createdAt: { gte: sevenDaysAgo }, userId: { not: null } },
        distinct: ["userId"],
        select: { userId: true },
        take: 50_000,
      }),
      this.prisma.user.aggregate({ _sum: { coinBalance: true } }),
      this.prisma.user.count({ where: { profileBonusFullDone: true } }),
      this.prisma.order.count(),
      this.prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isBestseller: true } }),
      this.prisma.product.count({ where: { isNewArrival: true } }),
      this.prisma.product.count({
        where: { OR: [{ discountPercent: { gt: 0 } }, { oldPriceUzs: { not: null } }] },
      }),
      this.prisma.product.aggregate({ _avg: { priceUzs: true } }),
      this.prisma.product.aggregate({ _sum: { stockGrams: true } }),
      this.prisma.product.aggregate({ _sum: { stock: true } }),
      this.prisma.product.count({ where: { stockGrams: { not: null } } }),
      this.prisma.product.count({ where: { stock: { not: null } } }),
      this.prisma.product.findMany({
        where: { OR: [{ stock: { not: null } }, { stockGrams: { not: null } }] },
        select: {
          stock: true,
          stockGrams: true,
          lowStockThreshold: true,
          lowStockGramsThreshold: true,
        },
        take: 5000,
      }),
      this.prisma.wishlist.count(),
      this.prisma.cartItem.count(),
      this.prisma.referralReward.count(),
      this.prisma.productFeedback.count({ where: { status: "PENDING" } }),
    ]);

    const tierDistribution: Record<UserTier, number> = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
    };
    for (const row of userTiers) {
      tierDistribution[row.tier] = row._count._all;
    }
    const orderStatusCounts: Record<OrderStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const row of orderStatusGroups) {
      orderStatusCounts[row.status] = row._count._all;
    }
    const lowStockCount = lowStockProducts.filter((p) => {
      const gramsLow =
        p.stockGrams !== null &&
        ((p.lowStockGramsThreshold !== null && p.stockGrams <= p.lowStockGramsThreshold) ||
          (p.lowStockGramsThreshold === null && p.stockGrams === 0));
      const piecesLow =
        p.stock !== null &&
        ((p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold) ||
          (p.lowStockThreshold === null && p.stock === 0));
      return gramsLow || piecesLow;
    }).length;

    return {
      users: {
        total: userTotal,
        tierDistribution,
        activeLast7d: activeLast7d.length,
        coinBalanceTotal: coinBalanceAgg._sum.coinBalance ?? 0,
        avgCoinBalance:
          userTotal > 0 ? Math.round((coinBalanceAgg._sum.coinBalance ?? 0) / userTotal) : 0,
        profileCompletionRate: userTotal > 0 ? profileFullCount / userTotal : 0,
      },
      orders: {
        total: orderTotal,
        pendingCount: orderStatusCounts.PENDING,
        confirmedCount: orderStatusCounts.CONFIRMED,
        shippedCount: orderStatusCounts.SHIPPED,
        deliveredCount: orderStatusCounts.DELIVERED,
        cancelledCount: orderStatusCounts.CANCELLED,
      },
      catalog: {
        productCount,
        bestsellerCount,
        newArrivalCount,
        discountedCount,
        averagePriceUzs: Math.round(avgPriceAgg._avg.priceUzs ?? 0),
      },
      inventory: {
        totalStockGrams: stockGramsAgg._sum.stockGrams ?? 0,
        totalStockPieces: stockPiecesAgg._sum.stock ?? 0,
        productsTrackedGrams,
        productsTrackedPieces,
        lowStockCount,
      },
      engagement: {
        wishlistCount,
        cartItemCount,
        referralRewardsCount,
        productFeedbackPending,
      },
    };
  }

  async getSearchTerms(fromIso: string, toIso: string): Promise<InsightsSearchTermResult[]> {
    const { from, to } = this.parseRange(fromIso, toIso);
    const rows = await this.prisma.analyticsEvent.findMany({
      where: { eventType: "SEARCH", createdAt: { gte: from, lte: to } },
      select: { searchQuery: true, properties: true },
      take: 5000,
      orderBy: { createdAt: "desc" },
    });
    const byQuery = new Map<string, InsightsSearchTermResult>();
    for (const row of rows) {
      const query = (row.searchQuery ?? "").trim();
      if (!query) continue;
      const existing = byQuery.get(query) ?? { query, count: 0, zeroResultCount: 0 };
      existing.count += 1;
      if (
        row.properties &&
        typeof row.properties === "object" &&
        "resultCount" in row.properties &&
        Number((row.properties as Record<string, unknown>).resultCount) === 0
      ) {
        existing.zeroResultCount += 1;
      }
      byQuery.set(query, existing);
    }
    return [...byQuery.values()].sort((a, b) => b.count - a.count).slice(0, 50);
  }

  private countByUtcDay(dates: Date[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const d of dates) {
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }

  private startOfUtcDay(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  }

  private endOfUtcDay(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  }

  private eachUtcDay(from: Date, to: Date): string[] {
    const days: string[] = [];
    const cursor = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 12, 0, 0, 0),
    );
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 12, 0, 0, 0));
    while (cursor <= end) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return days;
  }

  private parseRange(fromIso: string, toIso: string): { from: Date; to: Date } {
    const from = this.startOfUtcDay(new Date(fromIso));
    const to = this.endOfUtcDay(new Date(toIso));
    if (from > to) {
      throw new BadRequestException("`from` must be before or equal to `to`");
    }
    return { from, to };
  }
}
