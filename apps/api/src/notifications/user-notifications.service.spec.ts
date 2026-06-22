import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UserNotificationKind } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { UserNotificationsService } from "./user-notifications.service";

describe("UserNotificationsService", () => {
  let service: UserNotificationsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [UserNotificationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(UserNotificationsService);
  });

  it("create passes normalized fields to prisma", async () => {
    prisma.userNotification.create.mockResolvedValue({ id: "un1" } as never);
    await service.create({
      userId: "u1",
      kind: UserNotificationKind.SYSTEM,
      title: "T",
      body: "B",
      imageUrl: null,
      targetUrl: undefined,
      metadata: { k: 1 },
    });
    expect(prisma.userNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        kind: UserNotificationKind.SYSTEM,
        title: "T",
        body: "B",
        imageUrl: null,
        targetUrl: null,
        metadata: { k: 1 },
      }),
    });
  });

  it("listForUser aggregates paginated items and unreadCount", async () => {
    prisma.userNotification.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2);
    prisma.userNotification.findMany.mockResolvedValue([{ id: "a" }] as never);
    const result = await service.listForUser("u1", { page: 1, pageSize: 20 });
    expect(result).toEqual(
      expect.objectContaining({
        items: [{ id: "a" }],
        total: 3,
        page: 1,
        pageSize: 20,
        unreadCount: 2,
      }),
    );
  });

  it("markRead throws when notification belongs to another user", async () => {
    prisma.userNotification.findUnique.mockResolvedValue({
      id: "n1",
      userId: "other",
      readAt: null,
    } as never);
    await expect(service.markRead("u1", "n1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("markRead skips update when already read", async () => {
    const readAt = new Date();
    prisma.userNotification.findUnique.mockResolvedValue({
      id: "n1",
      userId: "u1",
      readAt,
    } as never);
    await service.markRead("u1", "n1");
    expect(prisma.userNotification.update).not.toHaveBeenCalled();
  });
});
