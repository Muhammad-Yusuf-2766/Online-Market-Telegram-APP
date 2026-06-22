import { Test } from "@nestjs/testing";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { AnalyticsService } from "./analytics.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [AnalyticsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(AnalyticsService);
  });

  it("returns 0 for empty events", async () => {
    expect(await service.track([], null)).toBe(0);
    expect(prisma.analyticsEvent.createMany).not.toHaveBeenCalled();
  });

  it("creates analytics events for authenticated user", async () => {
    prisma.analyticsEvent.createMany.mockResolvedValue({ count: 2 });
    const user = { id: "user-1" } as User;
    const count = await service.track(
      [
        { eventType: "APP_OPEN", sessionId: "s1" },
        { eventType: "PRODUCT_VIEW", sessionId: "s1", productId: "p1" },
      ],
      user,
      "test-agent",
    );
    expect(count).toBe(2);
    expect(prisma.analyticsEvent.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: "user-1", eventType: "APP_OPEN" }),
        ]),
      }),
    );
  });
});
