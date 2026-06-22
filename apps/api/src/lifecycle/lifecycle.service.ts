import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";

@Injectable()
export class LifecycleService {
  private readonly log = new Logger(LifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramNotifyService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runHourlyAbandonedCartNudges() {
    const threshold = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const carts = await this.prisma.cart.findMany({
      where: { updatedAt: { lte: threshold }, items: { some: {} } },
      include: { user: { select: { telegramId: true } }, items: { select: { qty: true } } },
      take: 500,
    });
    for (const cart of carts) {
      try {
        await this.telegram.sendPlainText(
          cart.user.telegramId,
          `Savatchangizda ${cart.items.length} ta mahsulot kutyapti. Xaridni yakunlang: /cart`,
        );
      } catch (error) {
        this.log.warn(`Failed abandoned cart nudge for cart ${cart.id}`, error as Error);
      }
    }
  }

  @Cron("0 8 * * *")
  async runDailyLifecycleJobs() {
    await this.recomputeUserTiers();
    this.log.debug("Daily lifecycle jobs completed");
  }

  private async recomputeUserTiers() {
    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const users = await this.prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      const agg = await this.prisma.order.aggregate({
        where: { userId: user.id, createdAt: { gte: since } },
        _sum: { cashPaidUzs: true, coinsAppliedUzs: true },
      });
      const total = (agg._sum.cashPaidUzs ?? 0) + (agg._sum.coinsAppliedUzs ?? 0);
      const tier =
        total >= 50000000 ? "PLATINUM" : total >= 20000000 ? "GOLD" : total >= 7000000 ? "SILVER" : "BRONZE";
      await this.prisma.user.update({
        where: { id: user.id },
        data: { tier, tierComputedAt: new Date() },
      });
    }
  }
}

