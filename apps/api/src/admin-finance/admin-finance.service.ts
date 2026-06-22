import { BadRequestException, Injectable } from "@nestjs/common";
import { CoinLedgerKind, OrderStatus, UserTier } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const ISSUE_KINDS: CoinLedgerKind[] = [
  CoinLedgerKind.REFERRAL_EARNED,
  CoinLedgerKind.PROFILE_BONUS,
  CoinLedgerKind.ADMIN_GIFT,
];

const TIER_ORDER: UserTier[] = [UserTier.BRONZE, UserTier.SILVER, UserTier.GOLD, UserTier.PLATINUM];

const STATUS_ORDER: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

export type FinanceKpis = {
  grossRevenueUzs: number;
  cashCollectedUzs: number;
  coinsAppliedUzs: number;
  promoDiscountUzs: number;
  ordersCount: number;
  cancelledCount: number;
  cancelledCashUzs: number;
  aovUzs: number;
  deliveredRevenueUzs: number;
  pendingPipelineUzs: number;
};

export type FinanceSeriesPoint = {
  date: string;
  grossUzs: number;
  cashUzs: number;
  coinsUzs: number;
  discountUzs: number;
  cancelledCashUzs: number;
  ordersCount: number;
  cancelledCount: number;
};

export type FinanceByStatusRow = {
  status: OrderStatus;
  count: number;
  grossUzs: number;
  cashUzs: number;
  coinsUzs: number;
};

export type FinanceByTierRow = {
  tier: UserTier;
  count: number;
  grossUzs: number;
  cashUzs: number;
  coinsUzs: number;
};

export type FinanceTopCustomerRow = {
  userId: string;
  telegramId: string;
  displayName: string;
  ordersCount: number;
  grossUzs: number;
  cashUzs: number;
  coinsUzs: number;
};

export type FinancePromoCodeRow = {
  promoCodeId: string;
  code: string;
  redemptions: number;
  discountUzs: number;
  ordersCount: number;
};

export type FinanceCoinEconomy = {
  issuedInRange: {
    total: number;
    byKind: {
      REFERRAL_EARNED: number;
      PROFILE_BONUS: number;
      ADMIN_GIFT: number;
      ADMIN_ADJUSTMENT_POSITIVE: number;
    };
  };
  redeemedInRange: number;
  refundedInRange: number;
  adminAdjustmentsNegativeInRange: number;
  netChangeInRange: number;
  outstandingLiabilityNow: number;
};

export type FinanceReportResult = {
  range: { fromIso: string; toIso: string; days: number };
  previousRange?: { fromIso: string; toIso: string };
  kpis: FinanceKpis;
  kpisPrev?: FinanceKpis;
  series: FinanceSeriesPoint[];
  byStatus: FinanceByStatusRow[];
  byTier: FinanceByTierRow[];
  topCustomers: FinanceTopCustomerRow[];
  promoCodes: FinancePromoCodeRow[];
  coinEconomy: FinanceCoinEconomy;
};

type PeriodBundle = {
  kpis: FinanceKpis;
  series: FinanceSeriesPoint[];
  byStatus: FinanceByStatusRow[];
  byTier: FinanceByTierRow[];
  topCustomers: FinanceTopCustomerRow[];
  promoCodes: FinancePromoCodeRow[];
};

@Injectable()
export class AdminFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(fromIso: string, toIso: string, compare = false): Promise<FinanceReportResult> {
    const from = this.startOfUtcDay(new Date(fromIso));
    const to = this.endOfUtcDay(new Date(toIso));
    if (from > to) {
      throw new BadRequestException("`from` must be before or equal to `to`");
    }

    const days = this.countUtcDays(from, to);
    const [current, coinEconomy, outstandingLiabilityNow] = await Promise.all([
      this.buildPeriodBundle(from, to),
      this.buildCoinEconomy(from, to),
      this.prisma.user.aggregate({ _sum: { coinBalance: true } }),
    ]);

    coinEconomy.outstandingLiabilityNow = outstandingLiabilityNow._sum.coinBalance ?? 0;

    let previousRange: { fromIso: string; toIso: string } | undefined;
    let kpisPrev: FinanceKpis | undefined;

    if (compare) {
      const prevTo = this.endOfUtcDay(
        new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() - 1, 12, 0, 0, 0)),
      );
      const prevFrom = this.startOfUtcDay(
        new Date(prevTo.getTime() - (days - 1) * 86_400_000),
      );
      previousRange = { fromIso: prevFrom.toISOString(), toIso: prevTo.toISOString() };
      const prev = await this.buildPeriodBundle(prevFrom, prevTo);
      kpisPrev = prev.kpis;
    }

    return {
      range: { fromIso: from.toISOString(), toIso: to.toISOString(), days },
      previousRange,
      kpis: current.kpis,
      kpisPrev,
      series: current.series,
      byStatus: current.byStatus,
      byTier: current.byTier,
      topCustomers: current.topCustomers,
      promoCodes: current.promoCodes,
      coinEconomy,
    };
  }

  async getSeriesCsv(fromIso: string, toIso: string): Promise<{ filename: string; content: string }> {
    const report = await this.getReport(fromIso, toIso, false);
    const from = fromIso.slice(0, 10);
    const to = toIso.slice(0, 10);
    const content = this.toCsv(report.series, [
      { key: "date", header: "date" },
      { key: "grossUzs", header: "gross_uzs" },
      { key: "cashUzs", header: "cash_uzs" },
      { key: "coinsUzs", header: "coins_uzs" },
      { key: "discountUzs", header: "discount_uzs" },
      { key: "cancelledCashUzs", header: "cancelled_cash_uzs" },
      { key: "ordersCount", header: "orders_count" },
      { key: "cancelledCount", header: "cancelled_count" },
    ]);
    return { filename: `finance-${from}_${to}.csv`, content };
  }

  async getOrdersCsv(fromIso: string, toIso: string): Promise<{ filename: string; content: string }> {
    const from = this.startOfUtcDay(new Date(fromIso));
    const to = this.endOfUtcDay(new Date(toIso));
    if (from > to) {
      throw new BadRequestException("`from` must be before or equal to `to`");
    }

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: {
        id: true,
        createdAt: true,
        status: true,
        userId: true,
        subtotalUzs: true,
        discountUzs: true,
        coinsAppliedUzs: true,
        cashPaidUzs: true,
        totalUzs: true,
        user: { select: { telegramId: true } },
        promoCode: { select: { code: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const rows = orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt.toISOString(),
      status: o.status,
      userId: o.userId,
      telegramId: o.user.telegramId,
      subtotalUzs: o.subtotalUzs,
      discountUzs: o.discountUzs,
      coinsAppliedUzs: o.coinsAppliedUzs,
      cashPaidUzs: o.cashPaidUzs,
      totalUzs: o.totalUzs,
      promoCode: o.promoCode?.code ?? "",
    }));

    const fromKey = fromIso.slice(0, 10);
    const toKey = toIso.slice(0, 10);
    const content = this.toCsv(rows, [
      { key: "id", header: "id" },
      { key: "createdAt", header: "created_at" },
      { key: "status", header: "status" },
      { key: "userId", header: "user_id" },
      { key: "telegramId", header: "telegram_id" },
      { key: "subtotalUzs", header: "subtotal_uzs" },
      { key: "discountUzs", header: "discount_uzs" },
      { key: "coinsAppliedUzs", header: "coins_applied_uzs" },
      { key: "cashPaidUzs", header: "cash_paid_uzs" },
      { key: "totalUzs", header: "total_uzs" },
      { key: "promoCode", header: "promo_code" },
    ]);
    return { filename: `finance-orders-${fromKey}_${toKey}.csv`, content };
  }

  private async buildPeriodBundle(from: Date, to: Date): Promise<PeriodBundle> {
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: {
        createdAt: true,
        status: true,
        userId: true,
        subtotalUzs: true,
        cashPaidUzs: true,
        coinsAppliedUzs: true,
        discountUzs: true,
        user: {
          select: {
            tier: true,
            telegramId: true,
            telegramUsername: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const [redemptions, promoOrders] = await Promise.all([
      this.prisma.promoRedemption.findMany({
        where: { redeemedAt: { gte: from, lte: to } },
        select: {
          promoCodeId: true,
          orderId: true,
          discountUzs: true,
          promoCode: { select: { code: true } },
        },
      }),
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          status: { not: OrderStatus.CANCELLED },
          promoCodeId: { not: null },
        },
        select: { promoCodeId: true },
      }),
    ]);

    const kpis = this.computeKpis(orders);
    const series = this.computeSeries(orders, from, to);
    const byStatus = this.computeByStatus(orders);
    const byTier = this.computeByTier(orders);
    const topCustomers = this.computeTopCustomers(orders);
    const promoCodes = this.computePromoCodes(redemptions, promoOrders);

    return { kpis, series, byStatus, byTier, topCustomers, promoCodes };
  }

  private computeKpis(
    orders: Array<{
      status: OrderStatus;
      subtotalUzs: number;
      cashPaidUzs: number;
      coinsAppliedUzs: number;
      discountUzs: number;
    }>,
  ): FinanceKpis {
    let grossRevenueUzs = 0;
    let cashCollectedUzs = 0;
    let coinsAppliedUzs = 0;
    let promoDiscountUzs = 0;
    let ordersCount = 0;
    let cancelledCount = 0;
    let cancelledCashUzs = 0;
    let deliveredRevenueUzs = 0;
    let pendingPipelineUzs = 0;

    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED) {
        cancelledCount += 1;
        cancelledCashUzs += o.cashPaidUzs;
        continue;
      }
      ordersCount += 1;
      grossRevenueUzs += o.subtotalUzs;
      cashCollectedUzs += o.cashPaidUzs;
      coinsAppliedUzs += o.coinsAppliedUzs;
      promoDiscountUzs += o.discountUzs;
      if (o.status === OrderStatus.DELIVERED) {
        deliveredRevenueUzs += o.subtotalUzs;
      }
      if (
        o.status === OrderStatus.PENDING ||
        o.status === OrderStatus.CONFIRMED ||
        o.status === OrderStatus.SHIPPED
      ) {
        pendingPipelineUzs += o.subtotalUzs;
      }
    }

    const paidValue = cashCollectedUzs + coinsAppliedUzs;
    return {
      grossRevenueUzs,
      cashCollectedUzs,
      coinsAppliedUzs,
      promoDiscountUzs,
      ordersCount,
      cancelledCount,
      cancelledCashUzs,
      aovUzs: ordersCount > 0 ? Math.round(paidValue / ordersCount) : 0,
      deliveredRevenueUzs,
      pendingPipelineUzs,
    };
  }

  private computeSeries(
    orders: Array<{
      createdAt: Date;
      status: OrderStatus;
      subtotalUzs: number;
      cashPaidUzs: number;
      coinsAppliedUzs: number;
      discountUzs: number;
    }>,
    from: Date,
    to: Date,
  ): FinanceSeriesPoint[] {
    const byDay = new Map<string, FinanceSeriesPoint>();
    for (const d of this.eachUtcDay(from, to)) {
      byDay.set(d, {
        date: d,
        grossUzs: 0,
        cashUzs: 0,
        coinsUzs: 0,
        discountUzs: 0,
        cancelledCashUzs: 0,
        ordersCount: 0,
        cancelledCount: 0,
      });
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (!bucket) continue;
      if (o.status === OrderStatus.CANCELLED) {
        bucket.cancelledCashUzs += o.cashPaidUzs;
        bucket.cancelledCount += 1;
      } else {
        bucket.grossUzs += o.subtotalUzs;
        bucket.cashUzs += o.cashPaidUzs;
        bucket.coinsUzs += o.coinsAppliedUzs;
        bucket.discountUzs += o.discountUzs;
        bucket.ordersCount += 1;
      }
    }
    return [...byDay.values()];
  }

  private computeByStatus(
    orders: Array<{
      status: OrderStatus;
      subtotalUzs: number;
      cashPaidUzs: number;
      coinsAppliedUzs: number;
    }>,
  ): FinanceByStatusRow[] {
    const map = new Map<OrderStatus, FinanceByStatusRow>();
    for (const status of STATUS_ORDER) {
      map.set(status, { status, count: 0, grossUzs: 0, cashUzs: 0, coinsUzs: 0 });
    }
    for (const o of orders) {
      const row = map.get(o.status)!;
      row.count += 1;
      row.grossUzs += o.subtotalUzs;
      row.cashUzs += o.cashPaidUzs;
      row.coinsUzs += o.coinsAppliedUzs;
    }
    return STATUS_ORDER.map((s) => map.get(s)!);
  }

  private computeByTier(
    orders: Array<{
      status: OrderStatus;
      subtotalUzs: number;
      cashPaidUzs: number;
      coinsAppliedUzs: number;
      user: { tier: UserTier };
    }>,
  ): FinanceByTierRow[] {
    const map = new Map<UserTier, FinanceByTierRow>();
    for (const tier of TIER_ORDER) {
      map.set(tier, { tier, count: 0, grossUzs: 0, cashUzs: 0, coinsUzs: 0 });
    }
    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED) continue;
      const row = map.get(o.user.tier)!;
      row.count += 1;
      row.grossUzs += o.subtotalUzs;
      row.cashUzs += o.cashPaidUzs;
      row.coinsUzs += o.coinsAppliedUzs;
    }
    return TIER_ORDER.map((t) => map.get(t)!);
  }

  private computeTopCustomers(
    orders: Array<{
      status: OrderStatus;
      userId: string;
      subtotalUzs: number;
      cashPaidUzs: number;
      coinsAppliedUzs: number;
      user: {
        telegramId: string;
        telegramUsername: string | null;
        firstName: string | null;
        lastName: string | null;
      };
    }>,
  ): FinanceTopCustomerRow[] {
    const map = new Map<
      string,
      FinanceTopCustomerRow & { _telegramUsername: string | null; _firstName: string | null; _lastName: string | null }
    >();
    for (const o of orders) {
      if (o.status === OrderStatus.CANCELLED) continue;
      const existing = map.get(o.userId);
      if (!existing) {
        map.set(o.userId, {
          userId: o.userId,
          telegramId: o.user.telegramId,
          displayName: this.formatDisplayName(o.user),
          ordersCount: 1,
          grossUzs: o.subtotalUzs,
          cashUzs: o.cashPaidUzs,
          coinsUzs: o.coinsAppliedUzs,
          _telegramUsername: o.user.telegramUsername,
          _firstName: o.user.firstName,
          _lastName: o.user.lastName,
        });
      } else {
        existing.ordersCount += 1;
        existing.grossUzs += o.subtotalUzs;
        existing.cashUzs += o.cashPaidUzs;
        existing.coinsUzs += o.coinsAppliedUzs;
      }
    }
    return [...map.values()]
      .map(({ _telegramUsername: _u, _firstName: _f, _lastName: _l, ...row }) => row)
      .sort((a, b) => b.grossUzs - a.grossUzs)
      .slice(0, 10);
  }

  private computePromoCodes(
    redemptions: Array<{
      promoCodeId: string;
      orderId: string;
      discountUzs: number;
      promoCode: { code: string };
    }>,
    promoOrders: Array<{ promoCodeId: string | null }>,
  ): FinancePromoCodeRow[] {
    const map = new Map<string, FinancePromoCodeRow & { orderIds: Set<string> }>();
    for (const r of redemptions) {
      const existing = map.get(r.promoCodeId);
      if (!existing) {
        map.set(r.promoCodeId, {
          promoCodeId: r.promoCodeId,
          code: r.promoCode.code,
          redemptions: 1,
          discountUzs: r.discountUzs,
          ordersCount: 0,
          orderIds: new Set([r.orderId]),
        });
      } else {
        existing.redemptions += 1;
        existing.discountUzs += r.discountUzs;
        existing.orderIds.add(r.orderId);
      }
    }
    const orderCountByPromo = new Map<string, number>();
    for (const o of promoOrders) {
      if (!o.promoCodeId) continue;
      orderCountByPromo.set(o.promoCodeId, (orderCountByPromo.get(o.promoCodeId) ?? 0) + 1);
    }
    return [...map.values()]
      .map(({ orderIds, ...row }) => ({
        ...row,
        ordersCount: orderCountByPromo.get(row.promoCodeId) ?? orderIds.size,
      }))
      .sort((a, b) => b.discountUzs - a.discountUzs);
  }

  private async buildCoinEconomy(from: Date, to: Date): Promise<FinanceCoinEconomy> {
    const entries = await this.prisma.coinLedgerEntry.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { kind: true, delta: true },
    });

    const byKind = {
      REFERRAL_EARNED: 0,
      PROFILE_BONUS: 0,
      ADMIN_GIFT: 0,
      ADMIN_ADJUSTMENT_POSITIVE: 0,
    };
    let issuedTotal = 0;
    let redeemedInRange = 0;
    let refundedInRange = 0;
    let adminAdjustmentsNegativeInRange = 0;

    for (const e of entries) {
      if (e.kind === CoinLedgerKind.CHECKOUT_SPEND && e.delta < 0) {
        redeemedInRange += Math.abs(e.delta);
        continue;
      }
      if (e.kind === CoinLedgerKind.ORDER_CANCEL_REFUND && e.delta > 0) {
        refundedInRange += e.delta;
        continue;
      }
      if (e.kind === CoinLedgerKind.ADMIN_ADJUSTMENT) {
        if (e.delta > 0) {
          byKind.ADMIN_ADJUSTMENT_POSITIVE += e.delta;
          issuedTotal += e.delta;
        } else if (e.delta < 0) {
          adminAdjustmentsNegativeInRange += Math.abs(e.delta);
        }
        continue;
      }
      if (ISSUE_KINDS.includes(e.kind) && e.delta > 0) {
        if (e.kind === CoinLedgerKind.REFERRAL_EARNED) byKind.REFERRAL_EARNED += e.delta;
        if (e.kind === CoinLedgerKind.PROFILE_BONUS) byKind.PROFILE_BONUS += e.delta;
        if (e.kind === CoinLedgerKind.ADMIN_GIFT) byKind.ADMIN_GIFT += e.delta;
        issuedTotal += e.delta;
      }
    }

    const netChangeInRange =
      issuedTotal - redeemedInRange + refundedInRange - adminAdjustmentsNegativeInRange;

    return {
      issuedInRange: { total: issuedTotal, byKind },
      redeemedInRange,
      refundedInRange,
      adminAdjustmentsNegativeInRange,
      netChangeInRange,
      outstandingLiabilityNow: 0,
    };
  }

  private formatDisplayName(user: {
    telegramUsername: string | null;
    firstName: string | null;
    lastName: string | null;
    telegramId: string;
  }): string {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    if (name) return name;
    if (user.telegramUsername) return `@${user.telegramUsername}`;
    return user.telegramId;
  }

  private toCsv<T extends Record<string, unknown>>(
    rows: T[],
    columns: Array<{ key: keyof T & string; header: string }>,
  ): string {
    const escape = (v: unknown): string => {
      const s = v == null ? "" : String(v);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = columns.map((c) => c.header).join(",");
    const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(",")).join("\n");
    return `${header}\n${body}`;
  }

  private countUtcDays(from: Date, to: Date): number {
    return this.eachUtcDay(from, to).length;
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
}
