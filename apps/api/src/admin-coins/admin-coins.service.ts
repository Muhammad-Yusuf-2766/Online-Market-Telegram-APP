import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CoinLedgerKind, type AdminCoinGift } from "@prisma/client";
import * as bcrypt from "bcrypt";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult, type PaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";

export type AdminCoinGiftRow = AdminCoinGift & {
  targetUser: { telegramId: string; firstName: string | null; lastName: string | null; locale: string };
};

@Injectable()
export class AdminCoinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramNotify: TelegramNotifyService,
  ) {}

  async giftCoins(params: {
    adminId: string;
    targetUserId: string;
    title: string;
    description: string;
    imageUrl: string;
    coins: number;
  }): Promise<AdminCoinGift> {
    if (params.coins <= 0) {
      throw new BadRequestException("coins must be positive");
    }
    const target = await this.prisma.user.findUnique({ where: { id: params.targetUserId } });
    if (!target) {
      throw new NotFoundException("User not found");
    }

    const gift = await this.prisma.$transaction(async (tx) => {
      const row = await tx.adminCoinGift.create({
        data: {
          title: params.title,
          description: params.description ?? "",
          imageUrl: params.imageUrl ?? "",
          coins: params.coins,
          targetUserId: params.targetUserId,
          createdByAdminId: params.adminId,
        },
      });
      await tx.user.update({
        where: { id: params.targetUserId },
        data: { coinBalance: { increment: params.coins } },
      });
      await tx.coinLedgerEntry.create({
        data: {
          userId: params.targetUserId,
          delta: params.coins,
          kind: CoinLedgerKind.ADMIN_GIFT,
          metadata: {
            adminCoinGiftId: row.id,
            title: params.title,
          },
        },
      });
      return row;
    });

    await this.telegramNotify.notifyCoinGift(
      target.telegramId,
      params.title,
      params.description ?? "",
      params.imageUrl ?? undefined,
      params.coins,
      target.locale,
    );

    return gift;
  }

  async adjustBalance(params: {
    adminUser: { id: string; passwordHash: string };
    targetUserId: string;
    password: string;
    deltaUzs: number;
    note?: string;
  }): Promise<{ newBalance: number }> {
    if (params.deltaUzs === 0) {
      throw new BadRequestException("deltaUzs must be non-zero");
    }
    const ok = await bcrypt.compare(params.password, params.adminUser.passwordHash);
    if (!ok) {
      throw new BadRequestException("Invalid password");
    }
    const target = await this.prisma.user.findUnique({ where: { id: params.targetUserId } });
    if (!target) {
      throw new NotFoundException("User not found");
    }
    const nextBalance = target.coinBalance + params.deltaUzs;
    if (nextBalance < 0) {
      throw new BadRequestException("Resulting balance would be negative");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: params.targetUserId },
        data: { coinBalance: nextBalance },
      });
      await tx.coinLedgerEntry.create({
        data: {
          userId: params.targetUserId,
          delta: params.deltaUzs,
          kind: CoinLedgerKind.ADMIN_ADJUSTMENT,
          metadata: {
            adminId: params.adminUser.id,
            note: params.note ?? "",
          },
        },
      });
    });

    void this.telegramNotify.notifyCoinsCredit(
      target.telegramId,
      params.deltaUzs,
      target.locale,
      "adjust",
    );

    return { newBalance: nextBalance };
  }

  async listGiftsPaginated(query: PaginationQueryDto): Promise<PaginatedResult<AdminCoinGiftRow>> {
    const { page, pageSize, skip } = paginationParams(query);
    const [total, items] = await Promise.all([
      this.prisma.adminCoinGift.count(),
      this.prisma.adminCoinGift.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          targetUser: {
            select: { telegramId: true, firstName: true, lastName: true, locale: true },
          },
        },
      }),
    ]);
    return toPaginatedResult(items as AdminCoinGiftRow[], total, page, pageSize);
  }

  async listLedgerPaginated(
    query: PaginationQueryDto & { userId?: string },
  ): Promise<PaginatedResult<{ id: string; userId: string; delta: number; kind: string; metadata: unknown; createdAt: Date }>> {
    const { page, pageSize, skip } = paginationParams(query);
    const where = query.userId ? { userId: query.userId } : {};
    const [total, rows] = await Promise.all([
      this.prisma.coinLedgerEntry.count({ where }),
      this.prisma.coinLedgerEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);
    return toPaginatedResult(rows, total, page, pageSize);
  }
}
