import { BadRequestException, Injectable } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type DashboardSeriesPoint = {
  date: string;
  orders: number;
  newUsers: number;
  revenueKrw: number;
  cancelledOrderCount: number;
};

export type DashboardStatsResult = {
  totals: {
    productCount: number;
    ordersInRange: number;
    newUsersInRange: number;
    revenueKrw: number;
    cancelledOrdersInRange: number;
  };
  series: DashboardSeriesPoint[];
};

export type DashboardOverviewResult = {
  users: { total: number; newLast7d: number };
  orders: {
    total: number;
    pendingCount: number;
    confirmedCount: number;
    preparingCount: number;
    shippedCount: number;
    deliveredCount: number;
    cancelledCount: number;
    todayOrders: number;
  };
  catalog: {
    productCount: number;
    saleCount: number;
    bestsellerCount: number;
    averagePriceKrw: number;
  };
  inventory: {
    totalStockQuantity: number;
    lowStockCount: number;
  };
  finance: {
    revenueKrw: number;
    deliveredRevenueKrw: number;
  };
  engagement: {
    wishlistCount: number;
    cartItemCount: number;
    productFeedbackPending: number;
  };
};

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(fromIso?: string, toIso?: string): Promise<DashboardStatsResult> {
    const { from, to } = this.parseRange(fromIso, toIso);
    const [productCount, orders, newUsersInRange] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true, status: true, totalKrw: true },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
    ]);

    const byDay = new Map<string, DashboardSeriesPoint>();
    for (const date of this.eachUtcDay(from, to)) {
      byDay.set(date, { date, orders: 0, newUsers: 0, revenueKrw: 0, cancelledOrderCount: 0 });
    }

    let revenueKrw = 0;
    let cancelledOrdersInRange = 0;
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (!bucket) continue;
      bucket.orders += 1;
      if (order.status === OrderStatus.CANCELLED) {
        bucket.cancelledOrderCount += 1;
        cancelledOrdersInRange += 1;
      } else {
        bucket.revenueKrw += order.totalKrw;
        revenueKrw += order.totalKrw;
      }
    }

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    });
    for (const user of users) {
      const bucket = byDay.get(user.createdAt.toISOString().slice(0, 10));
      if (bucket) bucket.newUsers += 1;
    }

    return {
      totals: {
        productCount,
        ordersInRange: orders.length,
        newUsersInRange,
        revenueKrw,
        cancelledOrdersInRange,
      },
      series: [...byDay.values()],
    };
  }

  async getOverview(): Promise<DashboardOverviewResult> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
    const todayStart = this.startOfUtcDay(new Date());
    const todayEnd = this.endOfUtcDay(new Date());
    const [
      userTotal,
      newLast7d,
      orderTotal,
      orderStatusGroups,
      todayOrders,
      productCount,
      saleCount,
      bestsellerCount,
      avgPriceAgg,
      stockAgg,
      lowStockProducts,
      wishlistCount,
      cartItemCount,
      productFeedbackPending,
      revenueAgg,
      deliveredRevenueAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.order.count(),
      this.prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.order.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isOnSale: true } }),
      this.prisma.product.count({ where: { isBestSeller: true } }),
      this.prisma.product.aggregate({ _avg: { priceKrw: true } }),
      this.prisma.product.aggregate({ _sum: { stockQuantity: true } }),
      this.prisma.product.findMany({
        select: { stockQuantity: true, lowStockThreshold: true },
        take: 5000,
      }),
      this.prisma.wishlist.count(),
      this.prisma.cartItem.count(),
      this.prisma.productFeedback.count({ where: { status: "PENDING" } }),
      this.prisma.order.aggregate({
        where: { status: { not: OrderStatus.CANCELLED } },
        _sum: { totalKrw: true },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED },
        _sum: { totalKrw: true },
      }),
    ]);

    const statusCounts: Record<OrderStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      PREPARING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const row of orderStatusGroups) {
      statusCounts[row.status] = row._count._all;
    }
    const lowStockCount = lowStockProducts.filter((p) => {
      const threshold = p.lowStockThreshold ?? 0;
      return p.stockQuantity <= threshold;
    }).length;

    return {
      users: { total: userTotal, newLast7d },
      orders: {
        total: orderTotal,
        pendingCount: statusCounts.PENDING,
        confirmedCount: statusCounts.CONFIRMED,
        preparingCount: statusCounts.PREPARING,
        shippedCount: statusCounts.SHIPPED,
        deliveredCount: statusCounts.DELIVERED,
        cancelledCount: statusCounts.CANCELLED,
        todayOrders,
      },
      catalog: {
        productCount,
        saleCount,
        bestsellerCount,
        averagePriceKrw: Math.round(avgPriceAgg._avg.priceKrw ?? 0),
      },
      inventory: {
        totalStockQuantity: stockAgg._sum.stockQuantity ?? 0,
        lowStockCount,
      },
      finance: {
        revenueKrw: revenueAgg._sum.totalKrw ?? 0,
        deliveredRevenueKrw: deliveredRevenueAgg._sum.totalKrw ?? 0,
      },
      engagement: { wishlistCount, cartItemCount, productFeedbackPending },
    };
  }

  private parseRange(fromIso?: string, toIso?: string): { from: Date; to: Date } {
    const today = new Date();
    const defaultFrom = new Date(Date.now() - 13 * 86_400_000);
    const from = this.startOfUtcDay(fromIso ? new Date(fromIso) : defaultFrom);
    const to = this.endOfUtcDay(toIso ? new Date(toIso) : today);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      throw new BadRequestException("Invalid date range");
    }
    return { from, to };
  }

  private startOfUtcDay(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  }

  private endOfUtcDay(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  }

  private eachUtcDay(from: Date, to: Date): string[] {
    const days: string[] = [];
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 12));
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 12));
    while (cursor <= end) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return days;
  }
}
