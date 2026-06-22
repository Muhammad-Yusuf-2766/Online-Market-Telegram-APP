import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AdminNotificationKind } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { NotificationsService } from "./notifications.service";

describe("NotificationsService", () => {
  let service: NotificationsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(NotificationsService);
  });

  it("createFromOrderReason uses ORDER_CREATED for created", async () => {
    const row = {
      id: "n1",
      kind: AdminNotificationKind.ORDER_CREATED,
      orderId: "o1",
      createdAt: new Date(),
    };
    prisma.adminNotification.create.mockResolvedValue(row as never);
    await service.createFromOrderReason("o1", "created");
    expect(prisma.adminNotification.create).toHaveBeenCalledWith({
      data: { kind: AdminNotificationKind.ORDER_CREATED, orderId: "o1" },
    });
  });

  it("createFromOrderReason uses ORDER_UPDATED for updated", async () => {
    const row = {
      id: "n2",
      kind: AdminNotificationKind.ORDER_UPDATED,
      orderId: "o2",
      createdAt: new Date(),
    };
    prisma.adminNotification.create.mockResolvedValue(row as never);
    await service.createFromOrderReason("o2", "updated");
    expect(prisma.adminNotification.create).toHaveBeenCalledWith({
      data: { kind: AdminNotificationKind.ORDER_UPDATED, orderId: "o2" },
    });
  });

  it("listForAdmin maps read flag from reads relation", async () => {
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    prisma.adminNotification.findMany.mockResolvedValue([
      {
        id: "n1",
        kind: AdminNotificationKind.ORDER_CREATED,
        orderId: "o1",
        createdAt,
        reads: [{ adminUserId: "admin-1" }],
      },
      {
        id: "n2",
        kind: AdminNotificationKind.ORDER_UPDATED,
        orderId: "o2",
        createdAt,
        reads: [],
      },
    ] as never);
    const list = await service.listForAdmin("admin-1", 10);
    expect(list).toEqual([
      expect.objectContaining({ id: "n1", read: true }),
      expect.objectContaining({ id: "n2", read: false }),
    ]);
    expect(prisma.adminNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, orderBy: { createdAt: "desc" } }),
    );
  });

  it("markRead throws when notification missing", async () => {
    prisma.adminNotification.findUnique.mockResolvedValue(null);
    await expect(service.markRead("admin-1", "missing")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.adminNotificationRead.upsert).not.toHaveBeenCalled();
  });

  it("markAllRead returns 0 when nothing unread", async () => {
    prisma.adminNotification.findMany.mockResolvedValue([]);
    await expect(service.markAllRead("admin-1")).resolves.toEqual({ marked: 0 });
    expect(prisma.adminNotificationRead.createMany).not.toHaveBeenCalled();
  });
});
