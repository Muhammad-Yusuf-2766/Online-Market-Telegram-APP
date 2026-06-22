import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { SegmentsService } from "../segments/segments.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";
import { UserNotificationsService } from "../notifications/user-notifications.service";
import { BroadcastsService } from "./broadcasts.service";

describe("BroadcastsService", () => {
  let service: BroadcastsService;
  let prisma: PrismaMock;
  let telegram: { sendPlainText: jest.Mock };
  let segments: { syncMembersFromDefinition: jest.Mock };
  let userNotifications: { create: jest.Mock };

  beforeEach(async () => {
    prisma = createPrismaMock();
    telegram = { sendPlainText: jest.fn().mockResolvedValue(undefined) };
    segments = { syncMembersFromDefinition: jest.fn().mockResolvedValue({ synced: 0 }) };
    userNotifications = { create: jest.fn().mockResolvedValue({}) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BroadcastsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TelegramNotifyService, useValue: telegram },
        { provide: SegmentsService, useValue: segments },
        { provide: UserNotificationsService, useValue: userNotifications },
      ],
    }).compile();

    service = moduleRef.get(BroadcastsService);
  });

  it("listPaginated returns paginated broadcasts", async () => {
    prisma.broadcast.count.mockResolvedValue(5);
    prisma.broadcast.findMany.mockResolvedValue([{ id: "b1" }] as never);
    const page = await service.listPaginated({ page: 2, pageSize: 10 });
    expect(page).toEqual(
      expect.objectContaining({
        items: [{ id: "b1" }],
        total: 5,
        page: 2,
        pageSize: 10,
      }),
    );
  });

  it("create sets SCHEDULED when scheduledFor present", async () => {
    prisma.broadcast.create.mockResolvedValue({ id: "b1" } as never);
    await service.create({
      title: "T",
      bodyUz: "Uz",
      bodyRu: "Ru",
      segmentId: "seg",
      scheduledFor: "2030-01-01T00:00:00.000Z",
    });
    expect(prisma.broadcast.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "SCHEDULED",
        scheduledFor: new Date("2030-01-01T00:00:00.000Z"),
      }),
    });
  });

  it("create defaults to DRAFT without schedule", async () => {
    prisma.broadcast.create.mockResolvedValue({ id: "b2" } as never);
    await service.create({
      title: "T",
      bodyUz: "Uz",
      bodyRu: "Ru",
      segmentId: "seg",
    });
    expect(prisma.broadcast.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "DRAFT", scheduledFor: null }),
    });
  });

  it("sendNow completes with zero recipients when segment has no members", async () => {
    prisma.broadcast.findUniqueOrThrow.mockResolvedValue({
      id: "br1",
      title: "Hi",
      segmentId: "seg1",
      bodyUz: "Uz body",
      bodyRu: "Ru body",
      imageUrl: null,
    } as never);
    prisma.userSegmentMembership.findMany.mockResolvedValue([]);
    prisma.broadcast.update.mockResolvedValue({} as never);

    await expect(service.sendNow("br1")).resolves.toEqual({ sent: 0 });

    expect(segments.syncMembersFromDefinition).toHaveBeenCalledWith("seg1");
    expect(telegram.sendPlainText).not.toHaveBeenCalled();
    expect(prisma.broadcast.update).toHaveBeenCalledWith({
      where: { id: "br1" },
      data: { status: "SENT", sentCount: 0, errorCount: 0 },
    });
  });

  it("sendNow notifies each member and logs delivery", async () => {
    prisma.broadcast.findUniqueOrThrow.mockResolvedValue({
      id: "br2",
      title: "Sale",
      segmentId: "seg1",
      bodyUz: "Uz",
      bodyRu: "Ru text",
      imageUrl: "https://img",
    } as never);
    prisma.userSegmentMembership.findMany
      .mockResolvedValueOnce([
        {
          id: "m1",
          user: { id: "u1", telegramId: "tg1", locale: "ru" },
        },
      ] as never)
      .mockResolvedValue([]);
    prisma.broadcastLog.create.mockResolvedValue({} as never);
    prisma.broadcast.update.mockResolvedValue({} as never);

    await expect(service.sendNow("br2")).resolves.toEqual({ sent: 1 });

    expect(telegram.sendPlainText).toHaveBeenCalledWith("tg1", "Ru text");
    expect(prisma.broadcastLog.create).toHaveBeenCalledWith({
      data: { broadcastId: "br2", userId: "u1", status: "SENT" },
    });
    expect(userNotifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        kind: "BROADCAST",
        title: "Sale",
        body: "Ru text",
      }),
    );
  });
});
