import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

export type CampaignListRow = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  attributedUsers: number;
  /** Full Mini App start URL when `TELEGRAM_BOT_USERNAME` and `TELEGRAM_WEB_APP_SHORT_NAME` are set. */
  miniAppUrl: string | null;
  attributedOrders: number;
  attributedRevenueUzs: number;
};

export type CampaignSlugCheckResult = {
  formatOk: boolean;
  available: boolean;
  previewUrl: string | null;
};

@Injectable()
export class AdminCampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  telegramMiniAppStartUrl(slug: string): string | null {
    const bot = this.config.get<string>("TELEGRAM_BOT_USERNAME")?.trim().replace(/^@/, "");
    const shortName = this.config.get<string>("TELEGRAM_WEB_APP_SHORT_NAME")?.trim();
    if (!bot || !shortName) {
      return null;
    }
    return `https://t.me/${bot}/${shortName}?startapp=c_${encodeURIComponent(slug)}`;
  }

  async checkSlug(slug: string): Promise<CampaignSlugCheckResult> {
    const trimmed = slug.trim().toLowerCase();
    const formatOk =
      trimmed.length >= 2 &&
      trimmed.length <= 48 &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed);
    if (!formatOk) {
      return { formatOk: false, available: false, previewUrl: null };
    }
    const existing = await this.prisma.trafficCampaign.findUnique({
      where: { slug: trimmed },
      select: { id: true },
    });
    return {
      formatOk: true,
      available: !existing,
      previewUrl: this.telegramMiniAppStartUrl(trimmed),
    };
  }

  linkHelp(): { template: string | null; envHints: string[] } {
    const hints: string[] = [];
    if (!this.config.get<string>("TELEGRAM_BOT_USERNAME")?.trim()) {
      hints.push("Set TELEGRAM_BOT_USERNAME (without @) for generated URLs.");
    }
    if (!this.config.get<string>("TELEGRAM_WEB_APP_SHORT_NAME")?.trim()) {
      hints.push("Set TELEGRAM_WEB_APP_SHORT_NAME (BotFather Mini App short name).");
    }
    return {
      template: this.telegramMiniAppStartUrl("your-slug"),
      envHints: hints,
    };
  }

  async create(slug: string, name: string): Promise<CampaignListRow> {
    try {
      const row = await this.prisma.trafficCampaign.create({
        data: { slug, name },
      });
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        createdAt: row.createdAt.toISOString(),
        attributedUsers: 0,
        miniAppUrl: this.telegramMiniAppStartUrl(row.slug),
        attributedOrders: 0,
        attributedRevenueUzs: 0,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Slug already exists");
      }
      throw e;
    }
  }

  async list(): Promise<CampaignListRow[]> {
    const rows = await this.prisma.trafficCampaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true } },
        users: { select: { id: true } },
      },
    });
    const orderAgg = await this.prisma.order.groupBy({
      by: ["userId"],
      _count: { _all: true },
      _sum: { cashPaidUzs: true, coinsAppliedUzs: true },
    });
    const byUser = new Map(
      orderAgg.map((row) => [
        row.userId,
        {
          orders: row._count._all,
          revenue: (row._sum.cashPaidUzs ?? 0) + (row._sum.coinsAppliedUzs ?? 0),
        },
      ]),
    );
    return rows.map((r) => {
      let attributedOrders = 0;
      let attributedRevenueUzs = 0;
      for (const user of r.users) {
        const agg = byUser.get(user.id);
        if (!agg) continue;
        attributedOrders += agg.orders;
        attributedRevenueUzs += agg.revenue;
      }
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        createdAt: r.createdAt.toISOString(),
        attributedUsers: r._count.users,
        miniAppUrl: this.telegramMiniAppStartUrl(r.slug),
        attributedOrders,
        attributedRevenueUzs,
      };
    });
  }

  async stats(slug: string, fromIso: string, toIso: string) {
    const from = this.startOfUtcDay(new Date(fromIso));
    const to = this.endOfUtcDay(new Date(toIso));
    if (from > to) {
      throw new BadRequestException("`from` must be before or equal to `to`");
    }
    const campaign = await this.prisma.trafficCampaign.findUnique({
      where: { slug },
      include: {
        users: {
          where: { createdAt: { gte: from, lte: to } },
          select: { createdAt: true },
        },
      },
    });
    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const totalAttributed = await this.prisma.user.count({ where: { campaignId: campaign.id } });
    const attributedOrders = await this.prisma.order.count({
      where: { user: { campaignId: campaign.id } },
    });
    const attributedRevenue = await this.prisma.order.aggregate({
      where: { user: { campaignId: campaign.id } },
      _sum: { cashPaidUzs: true, coinsAppliedUzs: true },
    });
    const firstOrders = await this.prisma.order.groupBy({
      by: ["userId"],
      where: { user: { campaignId: campaign.id } },
      _min: { createdAt: true },
    });
    const convertedFirstOrders = firstOrders.filter(
      (fo) => fo._min.createdAt && fo._min.createdAt >= from && fo._min.createdAt <= to,
    ).length;

    const byDay = new Map<string, number>();
    for (const d of this.eachUtcDay(from, to)) {
      byDay.set(d, 0);
    }
    for (const u of campaign.users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (byDay.has(key)) {
        byDay.set(key, (byDay.get(key) ?? 0) + 1);
      }
    }
    const series = [...byDay.entries()].map(([date, signups]) => ({ date, signups }));

    return {
      campaign: { id: campaign.id, slug: campaign.slug, name: campaign.name },
      totalAttributedUsers: totalAttributed,
      signupsInRange: campaign.users.length,
      attributedOrders,
      attributedRevenueUzs:
        (attributedRevenue._sum.cashPaidUzs ?? 0) + (attributedRevenue._sum.coinsAppliedUzs ?? 0),
      firstOrderConversionRate: totalAttributed > 0 ? convertedFirstOrders / totalAttributed : 0,
      series,
      sampleUrl: this.telegramMiniAppStartUrl(campaign.slug),
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
