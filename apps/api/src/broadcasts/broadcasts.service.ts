import { Injectable } from "@nestjs/common";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult, type PaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";
import { SegmentsService } from "../segments/segments.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";
import { UserNotificationsService } from "../notifications/user-notifications.service";

const MEMBERS_PAGE = 250;

@Injectable()
export class BroadcastsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramNotifyService,
    private readonly segments: SegmentsService,
    private readonly userNotifications: UserNotificationsService,
  ) {}

  async listPaginated(query: PaginationQueryDto) {
    const { page, pageSize, skip } = paginationParams(query);
    const [total, items] = await Promise.all([
      this.prisma.broadcast.count(),
      this.prisma.broadcast.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          segment: { select: { name: true, userCountCached: true } },
        },
      }),
    ]);
    return toPaginatedResult(items, total, page, pageSize);
  }

  create(body: {
    title: string;
    bodyUz: string;
    bodyRu: string;
    segmentId: string;
    imageUrl?: string;
    coinGiftAmount?: number;
    promoCodeId?: string;
    scheduledFor?: string;
  }) {
    return this.prisma.broadcast.create({
      data: {
        title: body.title,
        bodyUz: body.bodyUz,
        bodyRu: body.bodyRu,
        segmentId: body.segmentId,
        imageUrl: body.imageUrl ?? null,
        coinGiftAmount: body.coinGiftAmount ?? null,
        promoCodeId: body.promoCodeId ?? null,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
        status: body.scheduledFor ? "SCHEDULED" : "DRAFT",
      },
    });
  }

  async sendNow(id: string) {
    const broadcast = await this.prisma.broadcast.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        title: true,
        segmentId: true,
        bodyUz: true,
        bodyRu: true,
        imageUrl: true,
      },
    });

    await this.segments.syncMembersFromDefinition(broadcast.segmentId);

    let sent = 0;
    let cursor: { id: string } | undefined;

    for (;;) {
      const batch = await this.prisma.userSegmentMembership.findMany({
        where: { segmentId: broadcast.segmentId },
        take: MEMBERS_PAGE,
        orderBy: { id: "asc" },
        ...(cursor ? { skip: 1, cursor } : {}),
        include: { user: true },
      });

      if (batch.length === 0) {
        break;
      }

      for (const member of batch) {
        const text = member.user.locale === "ru" ? broadcast.bodyRu : broadcast.bodyUz;
        await this.telegram.sendPlainText(member.user.telegramId, text);
        sent += 1;
        await this.prisma.broadcastLog.create({
          data: { broadcastId: broadcast.id, userId: member.user.id, status: "SENT" },
        });
        void this.userNotifications
          .create({
            userId: member.user.id,
            kind: "BROADCAST",
            title: broadcast.title,
            body: text,
            imageUrl: broadcast.imageUrl,
            metadata: { broadcastId: broadcast.id },
          })
          .catch(() => undefined);
      }

      cursor = { id: batch[batch.length - 1]!.id };
    }

    await this.prisma.broadcast.update({
      where: { id },
      data: { status: "SENT", sentCount: sent, errorCount: 0 },
    });
    return { sent };
  }
}

