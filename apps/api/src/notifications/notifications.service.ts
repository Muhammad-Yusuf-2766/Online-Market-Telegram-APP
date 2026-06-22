import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AdminNotification } from "@prisma/client";
import { AdminNotificationKind } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type AdminNotificationListItem = {
  id: string;
  kind: AdminNotificationKind;
  orderId: string;
  read: boolean;
  createdAt: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromOrderReason(
    orderId: string,
    reason: "created" | "updated",
  ): Promise<AdminNotification> {
    const kind =
      reason === "created"
        ? AdminNotificationKind.ORDER_CREATED
        : AdminNotificationKind.ORDER_UPDATED;
    return this.prisma.adminNotification.create({
      data: { kind, orderId },
    });
  }

  async listForAdmin(
    adminUserId: string,
    limit: number,
  ): Promise<AdminNotificationListItem[]> {
    const take = Math.min(Math.max(limit, 1), 100);
    const rows = await this.prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        reads: { where: { adminUserId }, take: 1 },
      },
    });
    return rows.map((n) => ({
      id: n.id,
      kind: n.kind,
      orderId: n.orderId,
      read: n.reads.length > 0,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markRead(adminUserId: string, notificationId: string): Promise<{ ok: true }> {
    const exists = await this.prisma.adminNotification.findUnique({
      where: { id: notificationId },
    });
    if (!exists) {
      throw new NotFoundException("Notification not found");
    }
    await this.prisma.adminNotificationRead.upsert({
      where: {
        notificationId_adminUserId: {
          notificationId,
          adminUserId,
        },
      },
      create: { notificationId, adminUserId },
      update: {},
    });
    return { ok: true };
  }

  async markAllRead(adminUserId: string): Promise<{ marked: number }> {
    const unread = await this.prisma.adminNotification.findMany({
      where: { reads: { none: { adminUserId } } },
      select: { id: true },
    });
    if (!unread.length) {
      return { marked: 0 };
    }
    const result = await this.prisma.adminNotificationRead.createMany({
      data: unread.map((row) => ({
        notificationId: row.id,
        adminUserId,
      })),
      skipDuplicates: true,
    });
    return { marked: result.count };
  }
}
