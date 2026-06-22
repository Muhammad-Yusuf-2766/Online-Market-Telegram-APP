import { Injectable } from "@nestjs/common";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult } from "../common/pagination";
import { UserNotificationsService } from "../notifications/user-notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";

const USERS_PAGE = 250;

@Injectable()
export class BroadcastsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramNotifyService,
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
      }),
    ]);
    return toPaginatedResult(items, total, page, pageSize);
  }

  create(body: {
    title: string;
    body: string;
    imageUrl?: string;
    targetUrl?: string;
  }) {
    return this.prisma.broadcast.create({
      data: {
        title: body.title,
        body: body.body,
        imageUrl: body.imageUrl ?? null,
        targetUrl: body.targetUrl ?? null,
      },
    });
  }

  async sendNow(id: string) {
    const broadcast = await this.prisma.broadcast.findUniqueOrThrow({
      where: { id },
    });

    await this.prisma.broadcast.update({
      where: { id },
      data: { status: "SENDING", errorCount: 0 },
    });

    let sent = 0;
    let errors = 0;
    let cursor: { id: string } | undefined;

    for (;;) {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        take: USERS_PAGE,
        orderBy: { id: "asc" },
        ...(cursor ? { skip: 1, cursor } : {}),
      });
      if (users.length === 0) break;

      for (const user of users) {
        try {
          await this.telegram.sendPlainText(user.telegramId, broadcast.body);
          await this.prisma.broadcastLog.create({
            data: { broadcastId: broadcast.id, userId: user.id, status: "SENT" },
          });
          await this.userNotifications.create({
            userId: user.id,
            kind: "BROADCAST",
            title: broadcast.title,
            body: broadcast.body,
            imageUrl: broadcast.imageUrl,
            targetUrl: broadcast.targetUrl,
            metadata: { broadcastId: broadcast.id },
          });
          sent += 1;
        } catch (error) {
          errors += 1;
          await this.prisma.broadcastLog.create({
            data: {
              broadcastId: broadcast.id,
              userId: user.id,
              status: "FAILED",
              error: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }

      cursor = { id: users[users.length - 1]!.id };
    }

    await this.prisma.broadcast.update({
      where: { id },
      data: {
        status: errors > 0 ? "FAILED" : "SENT",
        sentCount: sent,
        errorCount: errors,
      },
    });
    return { sent, errors };
  }
}
