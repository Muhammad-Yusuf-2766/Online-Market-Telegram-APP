import { BadRequestException, Injectable } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type FinanceReportResult = {
  range: { fromIso: string; toIso: string; days: number };
  kpis: {
    grossRevenueKrw: number;
    deliveredRevenueKrw: number;
    pendingOrderAmountKrw: number;
    cancelledOrderAmountKrw: number;
    totalOrders: number;
    averageOrderValueKrw: number;
  };
  series: Array<{ date: string; revenueKrw: number; ordersCount: number; cancelledCount: number }>;
  byStatus: Array<{ status: OrderStatus; count: number; amountKrw: number }>;
  topProducts: Array<{ productId: string; title: string; quantity: number; revenueKrw: number }>;
  topCategories: Array<{ categoryId: string; name: string; quantity: number; revenueKrw: number }>;
};

@Injectable()
export class AdminFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(fromIso: string, toIso: string): Promise<FinanceReportResult> {
    const from = this.startOfUtcDay(new Date(fromIso));
    const to = this.endOfUtcDay(new Date(toIso));
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      throw new BadRequestException("Invalid date range");
    }

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        items: {
          include: {
            product: { select: { categoryId: true, category: { select: { name: true } } } },
          },
        },
      },
    });

    let grossRevenueKrw = 0;
    let deliveredRevenueKrw = 0;
    let pendingOrderAmountKrw = 0;
    let cancelledOrderAmountKrw = 0;
    let nonCancelledCount = 0;
    const byDay = new Map<string, { date: string; revenueKrw: number; ordersCount: number; cancelledCount: number }>();
    const byStatus = new Map<OrderStatus, { status: OrderStatus; count: number; amountKrw: number }>();
    const products = new Map<string, { productId: string; title: string; quantity: number; revenueKrw: number }>();
    const categories = new Map<string, { categoryId: string; name: string; quantity: number; revenueKrw: number }>();

    for (const day of this.eachUtcDay(from, to)) {
      byDay.set(day, { date: day, revenueKrw: 0, ordersCount: 0, cancelledCount: 0 });
    }
    for (const status of Object.values(OrderStatus)) {
      byStatus.set(status, { status, count: 0, amountKrw: 0 });
    }

    for (const order of orders) {
      const day = byDay.get(order.createdAt.toISOString().slice(0, 10));
      const statusRow = byStatus.get(order.status)!;
      statusRow.count += 1;
      statusRow.amountKrw += order.totalKrw;
      if (day) day.ordersCount += 1;

      if (order.status === OrderStatus.CANCELLED) {
        cancelledOrderAmountKrw += order.totalKrw;
        if (day) day.cancelledCount += 1;
        continue;
      }

      nonCancelledCount += 1;
      grossRevenueKrw += order.totalKrw;
      if (day) day.revenueKrw += order.totalKrw;
      if (order.status === OrderStatus.DELIVERED) deliveredRevenueKrw += order.totalKrw;
      if (
        order.status === OrderStatus.PENDING ||
        order.status === OrderStatus.CONFIRMED ||
        order.status === OrderStatus.PREPARING ||
        order.status === OrderStatus.SHIPPED
      ) {
        pendingOrderAmountKrw += order.totalKrw;
      }

      for (const item of order.items) {
        if (!item.productId) continue;
        const revenueKrw = item.quantity * item.unitPriceKrw;
        const product = products.get(item.productId) ?? {
          productId: item.productId,
          title: item.titleSnapshot,
          quantity: 0,
          revenueKrw: 0,
        };
        product.quantity += item.quantity;
        product.revenueKrw += revenueKrw;
        products.set(item.productId, product);

        const categoryId = item.product?.categoryId;
        if (categoryId) {
          const category = categories.get(categoryId) ?? {
            categoryId,
            name: item.product?.category.name ?? categoryId,
            quantity: 0,
            revenueKrw: 0,
          };
          category.quantity += item.quantity;
          category.revenueKrw += revenueKrw;
          categories.set(categoryId, category);
        }
      }
    }

    return {
      range: { fromIso: from.toISOString(), toIso: to.toISOString(), days: this.eachUtcDay(from, to).length },
      kpis: {
        grossRevenueKrw,
        deliveredRevenueKrw,
        pendingOrderAmountKrw,
        cancelledOrderAmountKrw,
        totalOrders: orders.length,
        averageOrderValueKrw: nonCancelledCount > 0 ? Math.round(grossRevenueKrw / nonCancelledCount) : 0,
      },
      series: [...byDay.values()],
      byStatus: [...byStatus.values()],
      topProducts: [...products.values()].sort((a, b) => b.revenueKrw - a.revenueKrw).slice(0, 10),
      topCategories: [...categories.values()].sort((a, b) => b.revenueKrw - a.revenueKrw).slice(0, 10),
    };
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
