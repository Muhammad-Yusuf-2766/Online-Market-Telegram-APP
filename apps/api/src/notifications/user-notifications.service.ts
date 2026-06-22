import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserNotificationKind } from "@prisma/client";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { paginationParams, toPaginatedResult } from "../common/pagination";
import { PrismaService } from "../prisma/prisma.service";

export type CreateUserNotificationInput = {
  userId: string;
  kind: UserNotificationKind;
  title: string;
  body: string;
  imageUrl?: string | null;
  targetUrl?: string | null;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class UserNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserNotificationInput) {
    return this.prisma.userNotification.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        imageUrl: input.imageUrl ?? null,
        targetUrl: input.targetUrl ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async listForUser(userId: string, query: PaginationQueryDto) {
    const { page, pageSize, skip } = paginationParams(query);
    const where = { userId };
    const [total, items, unreadCount] = await Promise.all([
      this.prisma.userNotification.count({ where }),
      this.prisma.userNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.userNotification.count({
        where: { userId, readAt: null },
      }),
    ]);
    return {
      ...toPaginatedResult(items, total, page, pageSize),
      unreadCount,
    };
  }

  async markRead(userId: string, notificationId: string) {
    const row = await this.prisma.userNotification.findUnique({
      where: { id: notificationId },
    });
    if (!row || row.userId !== userId) {
      throw new NotFoundException("Notification not found");
    }
    if (!row.readAt) {
      await this.prisma.userNotification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });
    }
    return { ok: true as const };
  }

  async markAllRead(userId: string) {
    await this.prisma.userNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true as const };
  }
}
